using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiscordClone.Migrations
{
    /// <inheritdoc />
    public partial class Test : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServerBans_AspNetUsers_UserId",
                table: "ServerBans");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "ServerBans",
                newName: "BanningUserId");

            migrationBuilder.RenameIndex(
                name: "IX_ServerBans_UserId",
                table: "ServerBans",
                newName: "IX_ServerBans_BanningUserId");

            migrationBuilder.AddColumn<Guid>(
                name: "ServerId",
                table: "UserServerRole",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "BannedUserId",
                table: "ServerBans",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_UserServerRole_ServerId",
                table: "UserServerRole",
                column: "ServerId");

            migrationBuilder.CreateIndex(
                name: "IX_ServerBans_BannedUserId",
                table: "ServerBans",
                column: "BannedUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServerBans_AspNetUsers_BannedUserId",
                table: "ServerBans",
                column: "BannedUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_ServerBans_AspNetUsers_BanningUserId",
                table: "ServerBans",
                column: "BanningUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserServerRole_Servers_ServerId",
                table: "UserServerRole",
                column: "ServerId",
                principalTable: "Servers",
                principalColumn: "ServerId",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServerBans_AspNetUsers_BannedUserId",
                table: "ServerBans");

            migrationBuilder.DropForeignKey(
                name: "FK_ServerBans_AspNetUsers_BanningUserId",
                table: "ServerBans");

            migrationBuilder.DropForeignKey(
                name: "FK_UserServerRole_Servers_ServerId",
                table: "UserServerRole");

            migrationBuilder.DropIndex(
                name: "IX_UserServerRole_ServerId",
                table: "UserServerRole");

            migrationBuilder.DropIndex(
                name: "IX_ServerBans_BannedUserId",
                table: "ServerBans");

            migrationBuilder.DropColumn(
                name: "ServerId",
                table: "UserServerRole");

            migrationBuilder.DropColumn(
                name: "BannedUserId",
                table: "ServerBans");

            migrationBuilder.RenameColumn(
                name: "BanningUserId",
                table: "ServerBans",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_ServerBans_BanningUserId",
                table: "ServerBans",
                newName: "IX_ServerBans_UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServerBans_AspNetUsers_UserId",
                table: "ServerBans",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
