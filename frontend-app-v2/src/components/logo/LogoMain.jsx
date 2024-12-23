// material-ui
import { useTheme } from '@mui/material/styles';

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoDark from 'assets/images/logo-dark.svg';
 * import logo from 'assets/images/logo.svg';
 *
 */

// ==============================|| LOGO SVG ||============================== //

const Logo = () => {
  const theme = useTheme();

  return (
    /**
     * if you want to use image instead of svg uncomment following, and comment out <svg> element.
     *
     * <img src={logo} alt="Mantis" width="100" />
     *
     */
    <>
      <svg id="visual" viewBox="0 0 118 35" width="118" height="35" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"><rect x="0" y="0" width="118" height="35" fill="#002233"></rect><path d="M82 35L112 35L112 34L85 34L85 32L77 32L77 31L80 31L80 29L96 29L96 28L104 28L104 27L112 27L112 25L69 25L69 24L83 24L83 22L73 22L73 21L82 21L82 20L91 20L91 18L103 18L103 17L69 17L69 15L97 15L97 14L89 14L89 13L87 13L87 11L78 11L78 10L69 10L69 8L72 8L72 7L85 7L85 6L111 6L111 4L82 4L82 3L71 3L71 1L81 1L81 0L118 0L118 1L118 1L118 3L118 3L118 4L118 4L118 6L118 6L118 7L118 7L118 8L118 8L118 10L118 10L118 11L118 11L118 13L118 13L118 14L118 14L118 15L118 15L118 17L118 17L118 18L118 18L118 20L118 20L118 21L118 21L118 22L118 22L118 24L118 24L118 25L118 25L118 27L118 27L118 28L118 28L118 29L118 29L118 31L118 31L118 32L118 32L118 34L118 34L118 35L118 35Z" fill="#1d4b8f" stroke-linecap="square" stroke-linejoin="miter"></path></svg>
    </>
  );
};

export default Logo;
