import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Grid,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Work as WorkIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  School as SkillIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useFormStore } from '../EmployeeOnboardingForm'

interface EmploymentStepProps {
  onProgressUpdate: (progress: number) => void
}

// Mock data for departments and skills
const departments = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'Human Resources',
  'Legal',
  'Customer Success'
]

const commonSkills = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Solidity',
  'Web3', 'DeFi', 'Smart Contracts', 'Blockchain', 'UI/UX Design',
  'Product Management', 'Marketing', 'Sales', 'Data Analysis',
  'Project Management', 'DevOps', 'Security', 'Testing'
]

const employmentTypes = [
  { value: 'Full-time', label: 'Full-time Employee' },
  { value: 'Part-time', label: 'Part-time Employee' },
  { value: 'Contractor', label: 'Independent Contractor' },
  { value: 'Intern', label: 'Intern' }
]

const workLocations = [
  { value: 'Remote', label: 'Fully Remote', icon: '🏠' },
  { value: 'Office', label: 'In-Office', icon: '🏢' },
  { value: 'Hybrid', label: 'Hybrid (Remote + Office)', icon: '🔄' }
]

/**
 * 💼 Employment Profile Step
 * 
 * This step handles:
 * - Job title and department selection
 * - Employment type and start date
 * - Work location and timezone
 * - Skills and experience
 * - Manager assignment
 * - Auto-generated employee ID
 */
export const EmploymentStep: React.FC<EmploymentStepProps> = ({ onProgressUpdate }) => {
  const { formData, updateFormData, errors } = useFormStore()
  const employmentData = formData.employment || {}
  const identityData = formData.identity || {}

  const [detectedTimezone, setDetectedTimezone] = useState('')
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([])

  // Generate employee ID based on name and department
  const generateEmployeeId = (name: string, department: string) => {
    if (!name || !department) return ''
    
    const nameCode = name.split(' ').map(part => part.charAt(0)).join('').toUpperCase()
    const deptCode = department.substring(0, 3).toUpperCase()
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `${deptCode}${nameCode}${randomNum}`
  }

  // Auto-detect timezone
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setDetectedTimezone(timezone)
    
    if (!employmentData.timeZone) {
      updateFormData('employment', { timeZone: timezone })
    }
  }, [employmentData.timeZone, updateFormData])

  // Auto-generate employee ID when name or department changes
  useEffect(() => {
    if (identityData.fullName && employmentData.department && !employmentData.employeeId) {
      const generatedId = generateEmployeeId(identityData.fullName, employmentData.department)
      updateFormData('employment', { employeeId: generatedId })
    }
  }, [identityData.fullName, employmentData.department, employmentData.employeeId, updateFormData])

  // Calculate step progress
  useEffect(() => {
    const requiredFields = ['jobTitle', 'department', 'employmentType', 'startDate', 'workLocation', 'timeZone']
    const completedFields = requiredFields.filter(field => 
      employmentData[field as keyof typeof employmentData]
    ).length
    
    const progress = (completedFields / requiredFields.length) * 100
    onProgressUpdate(progress)
  }, [employmentData, onProgressUpdate])

  // Suggest skills based on job title
  useEffect(() => {
    if (employmentData.jobTitle) {
      const title = employmentData.jobTitle.toLowerCase()
      const relevant = commonSkills.filter(skill => {
        const skillLower = skill.toLowerCase()
        return title.includes('engineer') && (skillLower.includes('javascript') || skillLower.includes('react') || skillLower.includes('python')) ||
               title.includes('designer') && skillLower.includes('design') ||
               title.includes('product') && (skillLower.includes('product') || skillLower.includes('management')) ||
               title.includes('marketing') && skillLower.includes('marketing') ||
               title.includes('web3') && (skillLower.includes('web3') || skillLower.includes('solidity') || skillLower.includes('blockchain'))
      })
      setSuggestedSkills(relevant.slice(0, 5))
    }
  }, [employmentData.jobTitle])

  const handleInputChange = (field: string) => (event: any) => {
    const value = event.target ? event.target.value : event
    updateFormData('employment', { [field]: value })
  }

  const handleSkillsChange = (event: any, newValue: string[]) => {
    updateFormData('employment', { skills: newValue })
  }

  const addSuggestedSkill = (skill: string) => {
    const currentSkills = employmentData.skills || []
    if (!currentSkills.includes(skill)) {
      updateFormData('employment', { skills: [...currentSkills, skill] })
    }
  }

  const regenerateEmployeeId = () => {
    if (identityData.fullName && employmentData.department) {
      const newId = generateEmployeeId(identityData.fullName, employmentData.department)
      updateFormData('employment', { employeeId: newId })
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          💼 Let's set up your employment profile
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Tell us about your role and how you prefer to work.
        </Typography>

        <Grid container spacing={4}>
          {/* Role Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  👔 Role Information
                </Typography>
                
                <TextField
                  fullWidth
                  label="Job Title"
                  value={employmentData.jobTitle || ''}
                  onChange={handleInputChange('jobTitle')}
                  error={!!errors.jobTitle}
                  helperText={errors.jobTitle}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={employmentData.department || ''}
                    onChange={handleInputChange('department')}
                    error={!!errors.department}
                    startAdornment={
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    }
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                    <MenuItem value="other">Other (specify in notes)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Employment Type</InputLabel>
                  <Select
                    value={employmentData.employmentType || ''}
                    onChange={handleInputChange('employmentType')}
                    error={!!errors.employmentType}
                  >
                    {employmentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <DatePicker
                  label="Start Date"
                  value={employmentData.startDate ? new Date(employmentData.startDate) : null}
                  onChange={(date) => {
                    updateFormData('employment', { 
                      startDate: date ? date.toISOString().split('T')[0] : '' 
                    })
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.startDate,
                      helperText: errors.startDate,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <ScheduleIcon />
                          </InputAdornment>
                        ),
                      },
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Work Preferences */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  🌍 Work Preferences
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Work Location</InputLabel>
                  <Select
                    value={employmentData.workLocation || ''}
                    onChange={handleInputChange('workLocation')}
                    error={!!errors.workLocation}
                  >
                    {workLocations.map((location) => (
                      <MenuItem key={location.value} value={location.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{location.icon}</span>
                          {location.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Time Zone"
                  value={employmentData.timeZone || ''}
                  onChange={handleInputChange('timeZone')}
                  error={!!errors.timeZone}
                  helperText={errors.timeZone || `Auto-detected: ${detectedTimezone}`}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Use detected timezone">
                          <IconButton
                            onClick={() => updateFormData('employment', { timeZone: detectedTimezone })}
                          >
                            <AutoAwesomeIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Preferred Working Hours"
                  value={employmentData.workingHours || ''}
                  onChange={handleInputChange('workingHours')}
                  placeholder="e.g., 9 AM - 5 PM EST"
                  helperText="This helps with scheduling payments and meetings"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ScheduleIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Manager/Supervisor (Optional)"
                  value={employmentData.manager || ''}
                  onChange={handleInputChange('manager')}
                  placeholder="Name or email of your direct manager"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Employee ID & Skills */}
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  🆔 Employee Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Employee ID"
                      value={employmentData.employeeId || ''}
                      onChange={handleInputChange('employeeId')}
                      helperText="Auto-generated based on your name and department"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Generate new ID">
                              <IconButton onClick={regenerateEmployeeId}>
                                <RefreshIcon />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Years of Experience"
                      value={employmentData.experience || ''}
                      onChange={handleInputChange('experience')}
                      placeholder="e.g., 3-5 years"
                      helperText="Relevant experience in your field"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Skills Section */}
                <Typography variant="subtitle2" gutterBottom>
                  Skills & Expertise
                </Typography>
                
                <Autocomplete
                  multiple
                  options={commonSkills}
                  value={employmentData.skills || []}
                  onChange={handleSkillsChange}
                  freeSolo
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Skills"
                      placeholder="Type or select skills"
                      helperText="Add your key skills and expertise areas"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SkillIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                  sx={{ mb: 2 }}
                />

                {/* Suggested Skills */}
                {suggestedSkills.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Suggested skills for your role:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                      {suggestedSkills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          size="small"
                          onClick={() => addSuggestedSkill(skill)}
                          clickable
                          variant="outlined"
                          icon={<AutoAwesomeIcon />}
                          sx={{ 
                            '&:hover': { 
                              bgcolor: 'primary.50',
                              borderColor: 'primary.main'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Employment Summary */}
        {employmentData.jobTitle && employmentData.department && (
          <Card sx={{ mt: 3, bgcolor: 'success.50', borderColor: 'success.200', border: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                📋 Employment Summary
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <WorkIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${employmentData.jobTitle} in ${employmentData.department}`}
                    secondary={`${employmentData.employmentType || 'Full-time'} • ${employmentData.workLocation || 'Remote'}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Starting ${employmentData.startDate || 'TBD'}`}
                    secondary={`Working in ${employmentData.timeZone || detectedTimezone}`}
                  />
                </ListItem>
                {employmentData.employeeId && (
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Employee ID: ${employmentData.employeeId}`}
                      secondary="Your unique identifier in the system"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  )
}

export default EmploymentStep
