import React, { useState } from 'react';

import { Grid, Paper } from '@mui/material';

import styles from './styles';

const DefaultPrompts = () => {
  const [hovers, setHovers] = useState([false, false, false, false]);

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
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default DefaultPrompts;
