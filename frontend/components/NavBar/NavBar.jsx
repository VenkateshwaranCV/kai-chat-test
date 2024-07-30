import React from 'react';

import ChatIcon from '@mui/icons-material/Chat';
import ExploreIcon from '@mui/icons-material/Explore';
import HomeIcon from '@mui/icons-material/Home';
import { Avatar, Button, Grid, Typography } from '@mui/material';

const NavBar = ({ onDiscoveryClick }) => (
  <Grid
    container
    justifyContent="space-between"
    alignItems="center"
    style={{ padding: '10px 20px', backgroundColor: '#1e1e1e' }}
  >
    <Typography variant="h6" style={{ color: 'white' }}>
      KAI
    </Typography>
    <Grid item>
      <Button startIcon={<HomeIcon />} style={{ color: 'white' }}>
        Home
      </Button>
      <Button
        startIcon={<ExploreIcon />}
        style={{ color: 'white' }}
        onClick={onDiscoveryClick}
      >
        Discovery
      </Button>
      <Button startIcon={<ChatIcon />} style={{ color: 'white' }}>
        Chat
      </Button>
    </Grid>
    <Grid item>
      <Avatar alt="User Avatar" src="/path-to-avatar.jpg" />
    </Grid>
  </Grid>
);

export default NavBar;
