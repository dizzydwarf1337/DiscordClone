using DiscordClone.Utils;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace DiscordClone.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class BaseController : ControllerBase
    {
        protected IActionResult HandleResult<T>(Result<T> result)
        {
            if (!result.IsSuccess)
            {
                return BadRequest(new { success = result.IsSuccess, message = result.Message });
            }
            return Ok(new { success = result.IsSuccess, data = result.Data });
        }
    }
}