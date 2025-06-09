import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useStore } from '../stores/store';


export default function HomePage() {
    const { userStore } = useStore();

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
                backgroundColor: "#36393f",
                color: "#ffffff",
                p: 3,
                textAlign: 'center',
                overflow: 'hidden'
            }}
        >

            <Typography
                variant="h1"
                sx={{
                    fontWeight: 700,
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                    mb: 2,
                    color: '#ffffff'
                }}
            >
                Welcome to Discord Clone
            </Typography>
            <Typography
                variant="h6"
                sx={{
                    color: '#b9bbbe',
                    fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                    mb: 4,
                    maxWidth: '600px'
                }}
            >
                Your place to talk, chat, and hang out. Join a server or connect with friends.
            </Typography>

            {userStore.isLoggedIn ? (
                <Button
                    component={Link}
                    to='/main'
                    variant="contained"
                    sx={{
                        bgcolor: '#5865f2',
                        color: 'white',
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        fontWeight: 500,
                        padding: { xs: '10px 20px', md: '12px 32px' },
                        borderRadius: '3px',
                        textTransform: 'none',
                        minWidth: '240px',
                        '&:hover': {
                            bgcolor: '#4752c4',
                        }
                    }}
                >
                    Open Discord Clone
                </Button>
            ) : (
                <Button
                    component={Link}
                    to='/login'
                    variant="contained"
                    sx={{
                        bgcolor: '#ffffff',
                        color: '#36393f',
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        fontWeight: 500,
                        padding: { xs: '10px 20px', md: '12px 32px' },
                        borderRadius: '3px',
                        textTransform: 'none',
                        minWidth: '240px',
                        '&:hover': {
                            bgcolor: '#f2f3f5',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }
                    }}
                >
                    Login / Get Started
                </Button>
            )}


        </Box>
    );
}