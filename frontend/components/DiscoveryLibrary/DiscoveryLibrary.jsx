import React from 'react';

import {
  Card,
  CardActionArea,
  CardContent,
  List,
  ListItem,
  Typography,
} from '@mui/material';

const DiscoveryLibrary = ({ prompts, onSelect }) => (
  <List>
    {prompts.map((prompt, index) => (
      <ListItem key={index} onClick={() => onSelect(prompt)}>
        <Card>
          <CardActionArea>
            <CardContent>
              <Typography variant="h5" component="div">
                {prompt.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {prompt.description}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </ListItem>
    ))}
  </List>
);

export default DiscoveryLibrary;
