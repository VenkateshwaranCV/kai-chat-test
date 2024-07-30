import React, { useState } from 'react';

import Box, { Grid, Paper, Typography } from '@mui/material';

import Image from 'next/image';

import Logo from '@/assets/svg/MenuLogo.svg';

import styles from './styles';

const DefaultPrompts = () => {
  const [hovers, setHovers] = useState([false, false, false, false]);
  const demoText = [
    'Help me make a class schedule for this quarter',
    'Pull up the latest course syllabus',
    'Give me the student list of the latest course',
    'Send emails to every student about the new homework notification',
  ];

  return (
    // The larger container to display cards
    <Grid style={{ ...styles.defaultPromptsProps }}>
      {[0, 1, 2, 3].map((value) => (
        <Grid
          key={value}
          item
          style={{ ...styles.defaultPromptsContainerProps }}
        >
          <Paper
            component="div"
            onMouseLeave={() => {
              const newHovers = [...hovers];
              newHovers[value] = false;
              setHovers(newHovers);
            }}
            onMouseEnter={() => {
              const newHovers = [...hovers];
              newHovers[value] = true;
              setHovers(newHovers);
            }}
            style={{
              ...(hovers[value]
                ? styles.hoverCard
                : styles.defaultPromptsSingleCardProps),
            }}
          >
            <Typography variant="body1" style={{ ...styles.texts }}>
              {demoText[value]}
            </Typography>
            <Logo viewBox="-30 -20 88.5 79.5" style={{ ...styles.logos }} />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default DefaultPrompts;
