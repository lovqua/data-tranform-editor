import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import TextProcessForm from '../components/text-process-form'
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import SAMPLE_TEXT from './api/sampleText'

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

type Props = {
  dataSample?: string
}

export default function Index({ dataSample }: Props) {

  return (
      <React.Fragment>
        <CssBaseline />
        <Box sx={{ width: '100%' }} >
          <Grid container spacing={2}>
            <Grid md={2}>
            </Grid>
            <Grid md={8}>
              <Item><TextProcessForm defaultRawData={dataSample}></TextProcessForm></Item>
            </Grid>
            <Grid md={2}>
            </Grid>
          </Grid>
        </Box>
      </React.Fragment>
  )
}

export const getStaticProps = async () => {

  return {
    props: { dataSample:SAMPLE_TEXT },
  }
}
