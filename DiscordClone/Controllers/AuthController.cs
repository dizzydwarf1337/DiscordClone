using DiscordClone.Db;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DiscordClone.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly IAuthService _authService;
        private readonly ApplicationContext _context;

        public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration configuration, ILogger<AuthController> logger, IAuthService authService, ApplicationContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _logger = logger;
            _authService = authService;
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for login attempt.");
                return BadRequest(new ApiResponse(false, "Invalid input data."));
            }

            try
            {
                var user = await _userManager.FindByNameAsync(loginDto.Username);
                if (user == null)
                {
                    _logger.LogWarning("Login failed for user {Username}: User not found", loginDto.Username);
                    return Unauthorized(new ApiResponse(false, "Invalid credentials."));
                }

                var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
                if (!result.Succeeded)
                {
                    _logger.LogWarning("Login failed for user {Username}: Incorrect password", loginDto.Username);
                    return Unauthorized(new ApiResponse(false, "Invalid credentials."));
                }

                _logger.LogInformation("Login successful for user {Username}. Generating new JWT token.", loginDto.Username);
                string token = await _authService.GenerateJwtTokenAsync(user);
                _logger.LogInformation("New JWT token generated successfully for user {Username}", loginDto.Username);

                return Ok(new ApiResponse(true, "Login successful", new { token }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while processing login for user {Username}", loginDto.Username);
                return StatusCode(500, new ApiResponse(false, "An error occurred while processing your request."));
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var token = await _context.UserTokens
                    .FirstOrDefaultAsync(t => t.UserId == Guid.Parse(userId) && t.LoginProvider == "Jwt" && t.Name == "Bearer");

                if (token != null)
                {
                    _context.UserTokens.Remove(token);
                    await _context.SaveChangesAsync();
                    await _signInManager.SignOutAsync();
                    _logger.LogInformation("User logged out successfully.");
                    return Ok(new ApiResponse(true, "Successfully logged out."));
                }
                else
                {
                    return Ok(new ApiResponse(true, "User is already logged out."));
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while logging out");
                return StatusCode(500, new ApiResponse(false, "An error occurred while processing your request."));
            }
        }
    }
}