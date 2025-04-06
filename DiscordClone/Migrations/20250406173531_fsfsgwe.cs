using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiscordClone.Migrations
{
    /// <inheritdoc />
    public partial class fsfsgwe : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "FriendGroups",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "FriendGroups");
        }
    }
}
