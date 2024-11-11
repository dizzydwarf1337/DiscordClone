using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using DiscordClone.Models;
using Microsoft.AspNetCore.Identity;

namespace DiscordClone.Services
{
    public class AuthService : IAuthService
    {
        // UserManager is used to manage user-related actions like finding user roles
        private readonly UserManager<User> _userManager;
        // IConfiguration is used to access configuration settings, such as JWT settings
        private readonly IConfiguration _configuration;
       
        // Constructor for dependency injection
        public AuthService(UserManager<User> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        // Method to generate a JWT token for a user
        public async Task<string> GenerateJwtTokenAsync(User user)
        {
            // List of claims for the user, including user ID and username
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // Claim for the user's unique identifier
                new Claim(ClaimTypes.Name, user.UserName)  // Claim for the user's username
            };

            // Get the roles assigned to the user and add them as claims
            var roles = await _userManager.GetRolesAsync(user);
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role)); // Add each role as a claim
            }

            // Generate a security key using the JWT secret key from configuration
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            // Create signing credentials using the security key and HMAC-SHA512 algorithm
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

            // Create a token descriptor that contains claims, expiration time, and signing credentials
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims), // Set the claims for the token
                Expires = DateTime.Now.AddDays(1), // Set the token expiration time (1 day)
                SigningCredentials = creds // Set the signing credentials for the token
            };

            // Create a token handler to generate the JWT token
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);// Create the token using the descriptor
           
            // Return the serialized JWT token as a string
            return tokenHandler.WriteToken(token);
        }
    }
}