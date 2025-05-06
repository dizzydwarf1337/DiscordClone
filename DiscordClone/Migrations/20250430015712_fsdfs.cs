using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiscordClone.Migrations
{
    /// <inheritdoc />
    public partial class fsdfs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GroupMessages_FriendGroups_GroupId",
                table: "GroupMessages");

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMessages_FriendGroups_GroupId",
                table: "GroupMessages",
                column: "GroupId",
                principalTable: "FriendGroups",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GroupMessages_FriendGroups_GroupId",
                table: "GroupMessages");

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMessages_FriendGroups_GroupId",
                table: "GroupMessages",
                column: "GroupId",
                principalTable: "FriendGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
