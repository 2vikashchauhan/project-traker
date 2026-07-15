'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { DRAWER_WIDTH } from './Sidebar';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleMenuClose();
    signOut({ callbackUrl: '/login' });
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { lg: `${DRAWER_WIDTH}px` },
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open navigation menu"
          edge="start"
          onClick={onMenuToggle}
          sx={{
            mr: 2,
            display: { lg: 'none' },
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="h1">
          Project Tracker
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {session?.user && (
          <>
            <IconButton onClick={handleMenuOpen} aria-label="User menu">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem disabled>
                <Typography variant="body1">{session.user.name}</Typography>
              </MenuItem>
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {session.user.role}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOut}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Sign Out</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
