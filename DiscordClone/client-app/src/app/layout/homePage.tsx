import { Box, Button, Typography } from '@mui/material';
import './styles.css'
import { Link } from 'react-router-dom';

export default function HomePage() {


	return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
                position: "absolute",
                top: 0,
            }}>
            <Typography variant="h1" fontStyle="italic">Welcome</Typography>
            <Link to='/main'>
                <Button>Go to ...</Button>
            </Link>
        </Box>
	)
}