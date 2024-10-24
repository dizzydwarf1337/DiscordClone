
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DiscordClone.Db
{
    public class ApplicationContext : IdentityDbContext
    {
        public ApplicationContext(DbContextOptions options) : base(options){}
    }
    
}
