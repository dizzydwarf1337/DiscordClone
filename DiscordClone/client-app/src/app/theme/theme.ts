import { createTheme } from "@mui/material";


const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#ffffff', 
        },
        background: {
            default: '#242424', 
        },
        text: {
            primary: 'rgba(255, 255, 255, 0.87)', 
        },
    },
    typography: {
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif', 
        fontWeightRegular: 400,
        lineHeight: 1.5,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textDecoration: 'none',
                    color: 'white',
                    width: '150px',
                    borderRadius: '17px',
                    boxShadow: '0px 0px 0px 1px white',
                    transition: '0.3s',
                    '&:hover': {
                        boxShadow: '0px 0px 5px 2px white',
                    },
                },
                containedPrimary: {
                    color: "black",
                    width: "100px",
                    borderRadius: "10px",
                    transition:"0.15s",
                    '&:hover': {
                        backgroundColor: "black",
                        color: "white",
                    }
                },
                containedSecondary: {

                }
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#2E2E2E',
                    width: '4%',
                    zIndex: 3,
                    paddingTop: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                },
            },
        },
    },
});

export default theme;

