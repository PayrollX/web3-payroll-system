const mongoose = require('mongoose')
const Company = require('../models/Company')
const User = require('../models/User')
const winston = require('winston')

/**
 * Migration script to convert existing company-only system to user-based system
 * This creates User accounts for existing companies and links them properly
 * @author Dev Austin
 */

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'migration' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/web3-payroll'
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    logger.info('Connected to MongoDB for migration')
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error)
    process.exit(1)
  }
}

async function migrateCompaniesToUsers() {
  try {
    logger.info('Starting migration from company-only to user-based system...')

    // Find all companies that don't have a primaryOwner set
    const legacyCompanies = await Company.find({
      $or: [
        { primaryOwner: { $exists: false } },
        { primaryOwner: null }
      ]
    })

    logger.info(`Found ${legacyCompanies.length} legacy companies to migrate`)

    let migratedCount = 0
    let errorCount = 0

    for (const company of legacyCompanies) {
      try {
        logger.info(`Migrating company: ${company.companyInfo.name} (${company._id})`)

        // Extract owner information from company
        const ownerInfo = company.ownerInfo
        if (!ownerInfo || !ownerInfo.walletAddress || !ownerInfo.name || !ownerInfo.email) {
          logger.warn(`Skipping company ${company._id} - missing required owner information`)
          continue
        }

        // Split name into first and last name
        const nameParts = ownerInfo.name.trim().split(' ')
        const firstName = nameParts[0] || 'Unknown'
        const lastName = nameParts.slice(1).join(' ') || 'User'

        // Check if user already exists for this wallet
        let user = await User.findByWallet(ownerInfo.walletAddress)
        
        if (!user) {
          // Create new user
          user = new User({
            personalInfo: {
              firstName,
              lastName,
              email: ownerInfo.email,
              phone: ownerInfo.phone || undefined
            },
            authentication: {
              walletAddress: ownerInfo.walletAddress.toLowerCase(),
              emailVerified: false,
              lastLoginAt: company.createdAt,
              loginCount: 1
            },
            onboarding: {
              isCompleted: true,
              currentStep: 'completed',
              completedAt: company.onboardedAt || company.createdAt,
              steps: {
                profileCompleted: true,
                companyLinked: true,
                emailVerified: false,
                walletVerified: true
              }
            },
            primaryCompany: company._id,
            activity: {
              lastActiveAt: company.updatedAt || company.createdAt,
              lastActiveCompany: company._id,
              sessionCount: 1
            },
            accountStatus: {
              isActive: company.isActive !== false,
              isVerified: true
            }
          })

          // Add company association with owner role
          user.addCompanyAssociation(
            company._id,
            'owner',
            User.getDefaultPermissions('owner'),
            null // no inviter for original owner
          )

          await user.save()
          logger.info(`Created user for wallet ${ownerInfo.walletAddress}: ${user.fullName}`)
        } else {
          // User exists, add company association if not already present
          if (!user.hasPermission('manage_company', company._id)) {
            user.addCompanyAssociation(
              company._id,
              'owner',
              User.getDefaultPermissions('owner'),
              null
            )
            
            // Set as primary company if user doesn't have one
            if (!user.primaryCompany) {
              user.primaryCompany = company._id
            }

            await user.save()
            logger.info(`Updated existing user ${user.fullName} with company association`)
          }
        }

        // Update company to reference the user
        company.primaryOwner = user._id

        // Add user to team members if not already there
        if (!company.isTeamMember(user._id)) {
          company.addTeamMember(user._id, 'owner', null)
        }

        await company.save()
        
        migratedCount++
        logger.info(`Successfully migrated company: ${company.companyInfo.name}`)

      } catch (error) {
        errorCount++
        logger.error(`Error migrating company ${company._id}:`, error)
      }
    }

    logger.info(`Migration completed:`)
    logger.info(`- Successfully migrated: ${migratedCount} companies`)
    logger.info(`- Errors encountered: ${errorCount} companies`)

    // Verification - count users and companies
    const totalUsers = await User.countDocuments()
    const totalCompanies = await Company.countDocuments()
    const companiesWithOwners = await Company.countDocuments({ primaryOwner: { $exists: true, $ne: null } })

    logger.info(`Post-migration statistics:`)
    logger.info(`- Total users: ${totalUsers}`)
    logger.info(`- Total companies: ${totalCompanies}`)
    logger.info(`- Companies with primary owners: ${companiesWithOwners}`)

    return {
      migratedCount,
      errorCount,
      totalUsers,
      totalCompanies,
      companiesWithOwners
    }

  } catch (error) {
    logger.error('Migration failed:', error)
    throw error
  }
}

async function verifyMigration() {
  try {
    logger.info('Verifying migration integrity...')

    // Check for orphaned companies (companies without users)
    const orphanedCompanies = await Company.find({
      $or: [
        { primaryOwner: { $exists: false } },
        { primaryOwner: null }
      ]
    })

    if (orphanedCompanies.length > 0) {
      logger.warn(`Found ${orphanedCompanies.length} orphaned companies:`)
      orphanedCompanies.forEach(company => {
        logger.warn(`- ${company.companyInfo.name} (${company._id})`)
      })
    }

    // Check for users without companies
    const usersWithoutCompanies = await User.find({
      companyAssociations: { $size: 0 }
    })

    if (usersWithoutCompanies.length > 0) {
      logger.warn(`Found ${usersWithoutCompanies.length} users without company associations:`)
      usersWithoutCompanies.forEach(user => {
        logger.warn(`- ${user.fullName} (${user.authentication.walletAddress})`)
      })
    }

    // Check for duplicate wallet addresses
    const duplicateWallets = await User.aggregate([
      {
        $group: {
          _id: '$authentication.walletAddress',
          count: { $sum: 1 },
          users: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ])

    if (duplicateWallets.length > 0) {
      logger.error(`Found ${duplicateWallets.length} duplicate wallet addresses:`)
      duplicateWallets.forEach(dup => {
        logger.error(`- Wallet ${dup._id} used by ${dup.count} users`)
      })
    }

    logger.info('Migration verification completed')
    
    return {
      orphanedCompanies: orphanedCompanies.length,
      usersWithoutCompanies: usersWithoutCompanies.length,
      duplicateWallets: duplicateWallets.length,
      isHealthy: orphanedCompanies.length === 0 && duplicateWallets.length === 0
    }

  } catch (error) {
    logger.error('Migration verification failed:', error)
    throw error
  }
}

async function main() {
  try {
    await connectToDatabase()
    
    const migrationResults = await migrateCompaniesToUsers()
    const verificationResults = await verifyMigration()

    logger.info('='.repeat(50))
    logger.info('MIGRATION SUMMARY')
    logger.info('='.repeat(50))
    logger.info(`Companies migrated: ${migrationResults.migratedCount}`)
    logger.info(`Migration errors: ${migrationResults.errorCount}`)
    logger.info(`Total users created/updated: ${migrationResults.totalUsers}`)
    logger.info(`Companies with owners: ${migrationResults.companiesWithOwners}`)
    logger.info(`Migration health check: ${verificationResults.isHealthy ? 'PASSED' : 'FAILED'}`)
    
    if (!verificationResults.isHealthy) {
      logger.warn('Migration completed with issues. Please review the warnings above.')
      process.exit(1)
    }

    logger.info('Migration completed successfully! 🎉')
    
  } catch (error) {
    logger.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    logger.info('Database connection closed')
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  await mongoose.connection.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  await mongoose.connection.close()
  process.exit(0)
})

// Run migration if called directly
if (require.main === module) {
  main()
}

module.exports = {
  migrateCompaniesToUsers,
  verifyMigration,
  connectToDatabase
}

