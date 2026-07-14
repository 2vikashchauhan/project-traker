'use client';

import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { DRAWER_WIDTH } from './Sidebar';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
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
      </Toolbar>
    </AppBar>
  );
}
