import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Sensors as SensorsIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import { useMsal, useAccount } from '@azure/msal-react';

export const Layout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
    handleMenuClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  // Get user display name and email
  const displayName = account?.name || 'Unknown User';
  const email = account?.username || '';
  const initials = displayName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Navigation items
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Upload', path: '/upload', icon: <FileUploadIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Toolbar>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <SensorsIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Tarra Monitoring
            </Typography>
          </Box>

          {/* Navigation Items */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 3 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  backgroundColor: location.pathname === item.path
                    ? alpha(theme.palette.common.white, 0.15)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* User Information */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* User Status Chip */}
            <Chip
              icon={<PersonIcon />}
              label="Online"
              color="success"
              variant="outlined"
              size="small"
              sx={{
                display: { xs: 'none', sm: 'flex' },
                color: 'white',
                borderColor: alpha(theme.palette.common.white, 0.3),
                backgroundColor: alpha(theme.palette.success.main, 0.2),
              }}
            />

            {/* User Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'white' }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                  {email}
                </Typography>
              </Box>

              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  p: 0,
                  border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  '&:hover': {
                    border: `2px solid ${alpha(theme.palette.common.white, 0.5)}`,
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    fontWeight: 600,
                  }}
                >
                  {initials}
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 280,
            mt: 1.5,
            borderRadius: 2,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>
        </Box>

        <Divider />

        {/* Menu Items */}
        <MenuItem onClick={() => handleNavigate('/dashboard')}>
          <ListItemIcon>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dashboard</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleNavigate('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        <Outlet />
      </Box>
    </Box>
  );
};
