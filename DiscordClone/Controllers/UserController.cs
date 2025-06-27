using DiscordClone.Db;
using DiscordClone.Models;
using DiscordClone.Models.Dtos; // Make sure this using directive is present
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.IO;
using Microsoft.AspNetCore.Http;

namespace DiscordClone.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UserController> _logger;
        private readonly IConfiguration _configuration;
        private readonly ApplicationContext _context;

        public UserController(UserManager<User> userManager, ILogger<UserController> logger, IConfiguration configuration, ApplicationContext context)
        {
            _userManager = userManager;
            _logger = logger;
            _configuration = configuration;
            _context = context;
        }

        [HttpPost("createUser")]
        public async Task<IActionResult> CreateUser([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse(false, "Invalid input data.", ModelState.SelectMany(x => x.Value.Errors).Select(e => e.ErrorMessage).ToList()));
            }
            try
            {
                var user = new User
                {
                    UserName = registerDto.Username,
                    Email = registerDto.Email,
                    CreatedAt = DateTime.UtcNow
                };
                var result = await _userManager.CreateAsync(user, registerDto.Password);
                if (!result.Succeeded)
                {
                    _logger.LogWarning("Failed to create user {Username}: {Errors}", registerDto.Username, string.Join(", ", result.Errors.Select(e => e.Description)));
                    return BadRequest(new ApiResponse(false, "Failed to create user.", result.Errors.Select(e => e.Description).ToList()));
                }
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var confirmationLink = Url.Action(nameof(ConfirmEmail), "User", new { userId = user.Id, token }, Request.Scheme);
                _logger.LogInformation("Confirmation link for {Username}: {ConfirmationLink}", user.UserName, confirmationLink);
                await _userManager.AddToRoleAsync(user, registerDto.Role);
                return Ok(new ApiResponse(true, "User created successfully. Please confirm your email address.", new { confirmationLink }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating user {Username}", registerDto.Username);
                return StatusCode(500, new ApiResponse(false, "An error occurred while processing your request."));
            }
        }

        [HttpPost("username")]
        public async Task<IActionResult> GetUserByUserName([FromBody] UserNameDto userNameDto)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == userNameDto.UserName);
                if (user == null)
                {
                    return NotFound(new ApiResponse(false, "User not found"));
                }
                var roles = await _userManager.GetRolesAsync(user);
                var roleName = roles.FirstOrDefault() ?? "User";

                return Ok(new ApiResponse(true, "User found successfully", new UserDto
                {
                    Email = user.Email,
                    Id = user.Id.ToString(),
                    Username = user.UserName,
                    Role = roleName,
                    Image = user.AvatarUrl
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user by username {Username}", userNameDto.UserName);
                return StatusCode(500, new ApiResponse(false, "An error occurred while processing your request."));
            }
        }

        [HttpGet("confirmEmail")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(token))
            {
                return BadRequest(new ApiResponse(false, "Invalid email confirmation request."));
            }
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse(false, "User not found."));
            }
            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (!result.Succeeded)
            {
                return BadRequest(new ApiResponse(false, "Email confirmation failed.", result.Errors.Select(e => e.Description).ToList()));
            }
            return Ok(new ApiResponse(true, "Email confirmed successfully."));
        }

        [HttpGet("{id}")]
        [Authorize] // Removed specific roles to allow any authenticated user to get their own, or admin for others
        public async Task<IActionResult> GetUser(string id)
        {
            // Optional: Add logic to check if current user is asking for their own details or if current user is admin
            // var currentUserId = _userManager.GetUserId(User);
            // if (currentUserId != id && !User.IsInRole("Admin")) { return Forbid(); }
            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning("User not found: {UserId}", id);
                    return NotFound(new ApiResponse(false, "User not found."));
                }
                var roles = await _userManager.GetRolesAsync(user);
                return Ok(new ApiResponse(true, "User retrieved successfully.", new UserDto { Id = user.Id.ToString(), Username = user.UserName, Email = user.Email, Role = roles.FirstOrDefault() ?? "User", Image = user.AvatarUrl }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving user {UserId}", id);
                return StatusCode(500, new ApiResponse(false, "An error occurred while processing your request."));
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UserPartialUpdateDto partialUpdateDto)
        {
            var currentUserId = _userManager.GetUserId(User);
            if (currentUserId != id && !User.IsInRole("Admin"))
            {
                _logger.LogWarning("User {CurrentUserId} attempted to update user {TargetUserId} without permission.", currentUserId, id);
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse(false, "Invalid input data.", ModelState.SelectMany(x => x.Value.Errors).Select(e => e.ErrorMessage).ToList()));
            }

            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning("User not found for update: {UserId}", id);
                    return NotFound(new ApiResponse(false, "User not found."));
                }

                bool hasChanges = false;

                if (!string.IsNullOrWhiteSpace(partialUpdateDto.Username) && partialUpdateDto.Username != user.UserName)
                {
                    var existingUserWithNewUsername = await _userManager.FindByNameAsync(partialUpdateDto.Username);
                    if (existingUserWithNewUsername != null && existingUserWithNewUsername.Id.ToString() != id)
                    {
                        return BadRequest(new ApiResponse(false, "Username already taken.", new[] { "Username already taken." }));
                    }
                    user.UserName = partialUpdateDto.Username;
                    user.NormalizedUserName = _userManager.NormalizeName(partialUpdateDto.Username);
                    hasChanges = true;
                }

                if (!string.IsNullOrWhiteSpace(partialUpdateDto.Email) && partialUpdateDto.Email != user.Email)
                {
                    var existingUserWithNewEmail = await _userManager.FindByEmailAsync(partialUpdateDto.Email);
                    if (existingUserWithNewEmail != null && existingUserWithNewEmail.Id.ToString() != id)
                    {
                        return BadRequest(new ApiResponse(false, "Email already taken.", new[] { "Email already taken." }));
                    }
                    user.Email = partialUpdateDto.Email;
                    user.NormalizedEmail = _userManager.NormalizeEmail(partialUpdateDto.Email);
                    hasChanges = true;
                }

                if (!hasChanges)
                {
                    return Ok(new ApiResponse(true, "No changes detected. User not updated."));
                }

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    _logger.LogWarning("Failed to update user {UserId}: {Errors}", id, string.Join(", ", result.Errors.Select(e => e.Description)));
                    return BadRequest(new ApiResponse(false, "Failed to update user.", result.Errors.Select(e => e.Description).ToList()));
                }

                return Ok(new ApiResponse(true, "User updated successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating user {UserId}", id);
                return StatusCode(500, new ApiResponse(false, "An error occurred while processing your request."));
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning("User not found for deletion: {UserId}", id);
                    return NotFound(new ApiResponse(false, "User not found."));
                }
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    _logger.LogWarning("Failed to delete user {UserId}: {Errors}", id, string.Join(", ", result.Errors.Select(e => e.Description)));
                    return BadRequest(new ApiResponse(false, "Failed to delete user.", result.Errors.Select(e => e.Description).ToList()));
                }
                _logger.LogInformation("User {UserId} deleted successfully by admin.", id);
                return Ok(new ApiResponse(true, "User deleted successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting user {UserId}", id);
                return StatusCode(500, new ApiResponse(false, "An error occurred while processing your request."));
            }
        }

        [HttpDelete("self")]
        [Authorize]
        public async Task<IActionResult> DeleteOwnAccount()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    _logger.LogWarning("Current user not found for self-deletion.");
                    return NotFound(new ApiResponse(false, "User not found."));
                }
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    _logger.LogWarning("Failed to delete own account for user {UserId}: {Errors}", user.Id, string.Join(", ", result.Errors.Select(e => e.Description)));
                    return BadRequest(new ApiResponse(false, "Failed to delete account.", result.Errors.Select(e => e.Description).ToList()));
                }
                _logger.LogInformation("User {UserId} deleted their own account.", user.Id);
                return Ok(new ApiResponse(true, "Account deleted successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting own account.");
                return StatusCode(500, new ApiResponse(false, "An error occurred while processing your request."));
            }
        }

        [HttpPost("update-avatar")]
        [Authorize]
        public async Task<IActionResult> UpdateAvatar([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse(false, "No file selected."));
            }
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound(new ApiResponse(false, "User not found"));
            }
            try
            {
                var avatarsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
                if (!Directory.Exists(avatarsPath))
                {
                    Directory.CreateDirectory(avatarsPath);
                }

                if (!string.IsNullOrEmpty(user.AvatarUrl) && user.AvatarUrl.StartsWith($"{Request.Scheme}://{Request.Host}/avatars/"))
                {
                    var oldFileName = Path.GetFileName(new Uri(user.AvatarUrl).LocalPath);
                    var oldFilePath = Path.Combine(avatarsPath, oldFileName);
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        System.IO.File.Delete(oldFilePath);
                        _logger.LogInformation("Deleted old avatar: {OldAvatarPath}", oldFilePath);
                    }
                }

                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(avatarsPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                var avatarUrl = $"/avatars/{fileName}";

                user.AvatarUrl = avatarUrl;
                var result = await _userManager.UpdateAsync(user);

                if (!result.Succeeded)
                {
                    if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
                    _logger.LogWarning("Failed to update user model with new avatar URL for {UserId}", user.Id);
                    return BadRequest(new ApiResponse(false, "Failed to update user avatar info.", result.Errors.Select(e => e.Description).ToList()));
                }

                var fullAvatarUrl = $"{Request.Scheme}://{Request.Host}{avatarUrl}";
                return Ok(new ApiResponse(true, "Avatar updated successfully.", new { avatarUrl = fullAvatarUrl }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating avatar for user {UserId}", user.Id);
                return StatusCode(500, new ApiResponse(false, "Error updating avatar"));
            }
        }
    }
}