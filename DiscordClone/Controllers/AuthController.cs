using DiscordClone.Models.Dtos;
using DiscordClone.Models;
using DiscordClone.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace DiscordClone.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        // UserManager is used to manage user-related actions like creating, finding users, etc.
        private readonly UserManager<User> _userManager;
        // SignInManager is used to handle user sign-in operations.
        private readonly SignInManager<User> _signInManager;
        // Configuration is used to access app settings.
        private readonly IConfiguration _configuration;
        // Logger is used for logging information and errors.
        private readonly ILogger<AuthController> _logger;
        // AuthService handles JWT token generation.
        private readonly IAuthService _authService;

        // Constructor for dependency injection
        public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration configuration, ILogger<AuthController> logger, IAuthService authService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _logger = logger;
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            // Check if the input model is valid
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for login attempt.");
                return BadRequest(new ApiResponse(false, "Invalid input data."));
            }

            try
            {
                // Find user by username
                var user = await _userManager.FindByNameAsync(loginDto.Username);
                if (user == null) // If user not found
                {
                    _logger.LogWarning("Login failed for user {Username}: User not found", loginDto.Username);
                    return Unauthorized(new ApiResponse(false, "Invalid credentials."));
                }

                // Check if the provided password is correct
                var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
                if (!result.Succeeded) // If password is incorrect
                {
                    _logger.LogWarning("Login failed for user {Username}: Incorrect password", loginDto.Username);
                    return Unauthorized(new ApiResponse(false, "Invalid credentials."));
                }

                // Generate JWT token for authenticated user
                var token = await _authService.GenerateJwtTokenAsync(user);
                _logger.LogInformation("JWT token generated successfully for user {Username}", loginDto.Username);
                return Ok(new ApiResponse(true, "Login successful", new { token }));
            }
            catch (Exception ex) // Handle any exceptions
            {
                _logger.LogError(ex, "An error occurred while processing login for user {Username}", loginDto.Username);
                return StatusCode(500, new ApiResponse(false, "An error occurred while processing your request."));
            }
        }

        [HttpPost("logout")]
        [Authorize] // Require user to be authorized to log out
        public async Task<IActionResult> Logout()
        {
            try
            {
                // Sign out the user
                await _signInManager.SignOutAsync();
                _logger.LogInformation("User logged out successfully.");
                return Ok(new ApiResponse(true, "Successfully logged out."));
            }
            catch (Exception ex) // Handle any exceptions
            {
                _logger.LogError(ex, "An error occurred while logging out");
                return StatusCode(500, new ApiResponse(false, "An error occurred while processing your request."));
            }
        }
    }
}