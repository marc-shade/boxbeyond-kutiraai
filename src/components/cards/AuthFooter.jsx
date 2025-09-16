// material-ui
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// ==============================|| FOOTER - AUTHENTICATION ||============================== //

export default function AuthFooter() {
  return (
    <Container maxWidth="xl">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent={{ xs: 'center', sm: 'space-between' }}
        spacing={2}
        textAlign={{ xs: 'center', sm: 'inherit' }}
      >
        <Typography variant="subtitle2" color="secondary">
          KutiraAI - Local AI Platform{' '}
          <Typography component={Link} variant="subtitle2" href="https://github.com/daniel-manickam/KutiraAI" target="_blank" underline="hover">
            Open Source
          </Typography>
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }} textAlign={{ xs: 'center', sm: 'inherit' }}>
          <Typography
            variant="subtitle2"
            color="secondary"
            component={Link}
            href="https://github.com/daniel-manickam/KutiraAI/blob/main/LICENSE"
            target="_blank"
            underline="hover"
          >
            MIT License
          </Typography>
          <Typography
            variant="subtitle2"
            color="secondary"
            component={Link}
            href="https://github.com/daniel-manickam/KutiraAI"
            target="_blank"
            underline="hover"
          >
            Documentation
          </Typography>
          <Typography
            variant="subtitle2"
            color="secondary"
            component={Link}
            href="https://github.com/daniel-manickam/KutiraAI/issues"
            target="_blank"
            underline="hover"
          >
            Support
          </Typography>
        </Stack>
      </Stack>
    </Container>
  );
}
