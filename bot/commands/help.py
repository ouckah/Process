"""Help command handler."""
import discord
from discord import app_commands
from discord.ext import commands
from discord.ui import View, Button
import os

from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")

# Command categories and descriptions
COMMAND_INFO = {
    "add": {
        "category": "processes",
        "description": "Add a stage to an existing process or create a new process",
        "usage": f"{PREFIX}add <company> <stage> [position]",
        "examples": [
            f"{PREFIX}add Google OA",
            f'{PREFIX}add Microsoft "Technical Interview" "SWE"',
            f"{PREFIX}add Amazon Phone Screen"
        ],
        "slash": "/add"
    },
    "delete": {
        "category": "processes",
        "description": "Delete a process by company name and optional position",
        "usage": f"{PREFIX}delete <company> [position]",
        "examples": [
            f"{PREFIX}delete Google",
            f'{PREFIX}delete Microsoft "Software Engineer"'
        ],
        "slash": "/delete"
    },
    "edit": {
        "category": "processes",
        "description": "Edit a process (company name, position, or privacy)",
        "usage": f"{PREFIX}edit <company> [position] <field> <new_value>",
        "examples": [
            f"{PREFIX}edit Google company name Alphabet",
            f'{PREFIX}edit Google "SWE" position "Software Engineer"',
            f"{PREFIX}edit Google privacy public",
            f'{PREFIX}edit Google "SWE" privacy private'
        ],
        "slash": "/edit",
        "notes": "Fields: company name, position, privacy. The API prevents duplicate processes with the same company name and position."
    },
    "list": {
        "category": "processes",
        "description": "List your processes or view someone else's public processes",
        "usage": f"{PREFIX}list [@mention or username]",
        "examples": [
            f"{PREFIX}list",
            f"{PREFIX}list @user",
            f"{PREFIX}list johndoe"
        ],
        "slash": "/list",
        "notes": "Without argument: Shows your processes. With @mention or username: Shows public processes of that user (if not anonymous and they have registered). Shows paginated results with interactive navigation."
    },
    "dashboard": {
        "category": "account",
        "description": "Get your web dashboard link or signup instructions",
        "usage": f"{PREFIX}dashboard",
        "examples": [f"{PREFIX}dashboard"],
        "slash": "/dashboard",
        "notes": "Has account: Direct link | No account: Signup instructions"
    },
    "help": {
        "category": "misc",
        "description": "Show command help (general overview or specific command details)",
        "usage": f"{PREFIX}help [command_name]",
        "examples": [
            f"{PREFIX}help",
            f"{PREFIX}help add"
        ],
        "slash": "/help"
    },
    "privacy": {
        "category": "settings",
        "description": "Set default privacy mode for processes created via Discord bot",
        "usage": f"{PREFIX}privacy <private | public>",
        "examples": [
            f"{PREFIX}privacy private",
            f"{PREFIX}privacy public"
        ],
        "slash": "/privacy",
        "notes": "Sets whether new processes are private or public by default"
    },
    "anon": {
        "category": "settings",
        "description": "Enable or disable anonymous mode for your profile",
        "usage": f"{PREFIX}anon <enable | disable>",
        "examples": [
            f"{PREFIX}anon enable",
            f"{PREFIX}anon disable"
        ],
        "slash": "/anon",
        "notes": "Controls whether your username is shown on your public profile"
    },
    "sankey": {
        "category": "analytics",
        "description": "Generate a Sankey diagram visualization of your public processes or another user's",
        "usage": f"{PREFIX}sankey [@mention or username]",
        "examples": [
            f"{PREFIX}sankey",
            f"{PREFIX}sankey @user",
            f"{PREFIX}sankey johndoe"
        ],
        "slash": "/sankey",
        "notes": "Without argument: Shows your Sankey diagram. With @mention or username: Shows that user's Sankey diagram (if they have public processes and are not anonymous)."
    },
    "mod": {
        "category": "moderator",
        "description": "Moderator commands for bot configuration (requires Manage Server permission)",
        "usage": f"{PREFIX}mod <subcommand> [args]",
        "examples": [
            f"{PREFIX}mod channel allow #general",
            f"{PREFIX}mod cooldown set add 5",
            f"{PREFIX}mod settings"
        ],
        "slash": "/mod",
        "notes": "Moderator-only commands. Subcommands: channel, cooldown, autodelete, prefix, command, settings, reset"
    }
}

# Mod subcommand information
MOD_SUBCOMMANDS = {
    "channel": {
        "description": "Manage channel restrictions for bot commands",
        "subcommands": {
            "allow": {
                "usage": f"{PREFIX}mod channel allow <#channel|all>",
                "slash": "/mod channel allow",
                "description": "Allow bot to work in a specific channel or all channels",
                "examples": [f"{PREFIX}mod channel allow #general", f"{PREFIX}mod channel allow all"]
            },
            "deny": {
                "usage": f"{PREFIX}mod channel deny <#channel|all>",
                "slash": "/mod channel deny",
                "description": "Deny bot from working in a specific channel or all channels",
                "examples": [f"{PREFIX}mod channel deny #spam", f"{PREFIX}mod channel deny all"]
            },
            "remove": {
                "usage": f"{PREFIX}mod channel remove <#channel>",
                "slash": "/mod channel remove",
                "description": "Remove channel from allow/deny lists",
                "examples": [f"{PREFIX}mod channel remove #general"]
            },
            "list": {
                "usage": f"{PREFIX}mod channel list",
                "slash": "/mod channel list",
                "description": "List all channel restrictions",
                "examples": [f"{PREFIX}mod channel list"]
            }
        }
    },
    "cooldown": {
        "description": "Manage command cooldowns",
        "subcommands": {
            "set": {
                "usage": f"{PREFIX}mod cooldown set <command> <seconds>",
                "slash": "/mod cooldown set",
                "description": "Set cooldown for a specific command",
                "examples": [f"{PREFIX}mod cooldown set add 5", f"{PREFIX}mod cooldown set list 10"]
            },
            "remove": {
                "usage": f"{PREFIX}mod cooldown remove <command>",
                "slash": "/mod cooldown remove",
                "description": "Remove cooldown for a command",
                "examples": [f"{PREFIX}mod cooldown remove add"]
            },
            "list": {
                "usage": f"{PREFIX}mod cooldown list",
                "slash": "/mod cooldown list",
                "description": "List all command cooldowns",
                "examples": [f"{PREFIX}mod cooldown list"]
            }
        }
    },
    "autodelete": {
        "description": "Manage auto-delete settings for bot responses",
        "subcommands": {
            "set": {
                "usage": f"{PREFIX}mod autodelete set <seconds>",
                "slash": "/mod autodelete set",
                "description": "Set auto-delete delay for bot responses (0 to disable)",
                "examples": [f"{PREFIX}mod autodelete set 30", f"{PREFIX}mod autodelete set 60"]
            },
            "disable": {
                "usage": f"{PREFIX}mod autodelete disable",
                "slash": "/mod autodelete disable",
                "description": "Disable auto-delete for bot responses",
                "examples": [f"{PREFIX}mod autodelete disable"]
            }
        }
    },
    "prefix": {
        "description": "Manage custom command prefix for this server",
        "subcommands": {
            "set": {
                "usage": f"{PREFIX}mod prefix set <prefix>",
                "slash": "/mod prefix set",
                "description": "Set custom prefix for this server",
                "examples": [f"{PREFIX}mod prefix set !", f"{PREFIX}mod prefix set bot!"]
            },
            "reset": {
                "usage": f"{PREFIX}mod prefix reset",
                "slash": "/mod prefix reset",
                "description": "Reset prefix to default",
                "examples": [f"{PREFIX}mod prefix reset"]
            }
        }
    },
    "command": {
        "description": "Enable or disable commands in this server",
        "subcommands": {
            "disable": {
                "usage": f"{PREFIX}mod command disable <command>",
                "slash": "/mod command disable",
                "description": "Disable a command in this server",
                "examples": [f"{PREFIX}mod command disable add", f"{PREFIX}mod command disable delete"]
            },
            "enable": {
                "usage": f"{PREFIX}mod command enable <command>",
                "slash": "/mod command enable",
                "description": "Re-enable a disabled command",
                "examples": [f"{PREFIX}mod command enable add"]
            },
            "list": {
                "usage": f"{PREFIX}mod command list",
                "slash": "/mod command list",
                "description": "List all disabled commands",
                "examples": [f"{PREFIX}mod command list"]
            }
        }
    },
    "settings": {
        "description": "View all current bot settings for this server",
        "usage": f"{PREFIX}mod settings",
        "slash": "/mod settings",
        "examples": [f"{PREFIX}mod settings"]
    },
    "reset": {
        "description": "Reset all bot settings to defaults",
        "usage": f"{PREFIX}mod reset",
        "slash": "/mod reset",
        "examples": [f"{PREFIX}mod reset"]
    }
}


class ModHelpView(View):
    """View for paginating through mod subcommand help."""
    def __init__(self, embeds: list[discord.Embed], total_pages: int):
        super().__init__(timeout=300)  # 5 minute timeout
        self.embeds = embeds
        self.total_pages = total_pages
        self.current_page = 0
        
        # Update button states
        self.update_buttons()
    
    def update_buttons(self):
        """Update button states based on current page."""
        # Clear existing buttons
        self.clear_items()
        
        # Previous button
        prev_button = Button(
            label="◀ Previous",
            style=discord.ButtonStyle.primary,
            disabled=self.current_page == 0
        )
        prev_button.callback = self.previous_page
        self.add_item(prev_button)
        
        # Page indicator
        page_button = Button(
            label=f"Page {self.current_page + 1}/{self.total_pages}",
            style=discord.ButtonStyle.secondary,
            disabled=True
        )
        self.add_item(page_button)
        
        # Next button
        next_button = Button(
            label="Next ▶",
            style=discord.ButtonStyle.primary,
            disabled=self.current_page >= self.total_pages - 1
        )
        next_button.callback = self.next_page
        self.add_item(next_button)
    
    async def previous_page(self, interaction: discord.Interaction):
        """Go to previous page."""
        if self.current_page > 0:
            self.current_page -= 1
            self.update_buttons()
            await interaction.response.edit_message(embed=self.embeds[self.current_page], view=self)
        else:
            await interaction.response.defer()
    
    async def next_page(self, interaction: discord.Interaction):
        """Go to next page."""
        if self.current_page < self.total_pages - 1:
            self.current_page += 1
            self.update_buttons()
            await interaction.response.edit_message(embed=self.embeds[self.current_page], view=self)
        else:
            await interaction.response.defer()


async def handle_mod_help(subcommand: str = None, user: discord.Member = None, guild: discord.Guild = None) -> tuple[list[discord.Embed], int]:
    """
    Handle mod command help. Returns list of embeds and total page count.
    
    If subcommand is provided, shows detailed help for that subcommand.
    Otherwise, shows paginated overview of all subcommands.
    """
    prefix = PREFIX
    
    # Check permission
    if not user or not guild:
        embed = discord.Embed(
            title="❌ Permission Denied",
            description="This command can only be used in a server.",
            color=0xFF0000
        )
        return [embed], 1
    
    from utils.permissions import has_mod_permission
    if not has_mod_permission(user, guild):
        embed = discord.Embed(
            title="❌ Permission Denied",
            description="You need the **Manage Server** permission to view moderator commands.",
            color=0xFF0000
        )
        return [embed], 1
    
    # If specific subcommand requested
    if subcommand:
        subcommand = subcommand.lower().strip()
        
        # Handle nested subcommands (e.g., "channel allow")
        parts = subcommand.split()
        main_sub = parts[0]
        nested_sub = parts[1] if len(parts) > 1 else None
        
        # Check if it's a main subcommand (e.g., "channel")
        if main_sub in MOD_SUBCOMMANDS:
            main_info = MOD_SUBCOMMANDS[main_sub]
            
            # If nested subcommand (e.g., "channel allow")
            if nested_sub and "subcommands" in main_info:
                if nested_sub in main_info["subcommands"]:
                    nested_info = main_info["subcommands"][nested_sub]
                    embed = discord.Embed(
                        title=f"⚙️ Mod: {main_sub.title()} {nested_sub.title()}",
                        description=nested_info["description"],
                        color=0x5865F2
                    )
                    
                    usage_text = f"```\n{nested_info['usage']}\n{nested_info.get('slash', '')}\n```"
                    embed.add_field(name="Usage", value=usage_text, inline=False)
                    
                    if nested_info.get("examples"):
                        examples_text = "\n".join(nested_info["examples"])
                        embed.add_field(name="Examples", value=f"```\n{examples_text}\n```", inline=False)
                    
                    embed.set_footer(text=f"Use {prefix}help mod for all subcommands")
                    embed.timestamp = discord.utils.utcnow()
                    return [embed], 1
                else:
                    # Nested subcommand not found
                    embed = discord.Embed(
                        title="❌ Subcommand Not Found",
                        description=f"Subcommand `{nested_sub}` not found for `{main_sub}`.\n\n"
                                   f"Use `{prefix}help mod {main_sub}` to see available subcommands.",
                        color=0xFF0000
                    )
                    return [embed], 1
            
            # Main subcommand overview (e.g., "channel")
            if "subcommands" in main_info:
                embed = discord.Embed(
                    title=f"⚙️ Mod: {main_sub.title()}",
                    description=main_info["description"],
                    color=0x5865F2
                )
                
                # List all subcommands
                subcommands_list = []
                for sub_name, sub_info in main_info["subcommands"].items():
                    subcommands_list.append(f"**{sub_name}** - {sub_info['description']}")
                
                embed.add_field(
                    name="Subcommands",
                    value="\n".join(subcommands_list),
                    inline=False
                )
                
                # Show usage examples
                examples = []
                for sub_name, sub_info in list(main_info["subcommands"].items())[:3]:
                    if sub_info.get("examples"):
                        examples.extend(sub_info["examples"][:1])
                
                if examples:
                    embed.add_field(
                        name="Examples",
                        value="\n".join([f"`{ex}`" for ex in examples]),
                        inline=False
                    )
                
                embed.add_field(
                    name="View Details",
                    value=f"Use `{prefix}help mod {main_sub} <subcommand>` to see detailed help for a specific subcommand.",
                    inline=False
                )
                
                embed.set_footer(text=f"Use {prefix}help mod for all subcommands")
                embed.timestamp = discord.utils.utcnow()
                return [embed], 1
            else:
                # Main subcommand without nested subcommands (e.g., "settings", "reset")
                embed = discord.Embed(
                    title=f"⚙️ Mod: {main_sub.title()}",
                    description=main_info["description"],
                    color=0x5865F2
                )
                
                usage_text = f"```\n{main_info['usage']}\n{main_info.get('slash', '')}\n```"
                embed.add_field(name="Usage", value=usage_text, inline=False)
                
                if main_info.get("examples"):
                    examples_text = "\n".join(main_info["examples"])
                    embed.add_field(name="Examples", value=f"```\n{examples_text}\n```", inline=False)
                
                embed.set_footer(text=f"Use {prefix}help mod for all subcommands")
                embed.timestamp = discord.utils.utcnow()
                return [embed], 1
        
        # Check if it's a nested subcommand (e.g., "allow" might be under "channel")
        # Search through all main subcommands to find if this is a nested one
        for main_name, main_info in MOD_SUBCOMMANDS.items():
            if "subcommands" in main_info and main_sub in main_info["subcommands"]:
                # Found it! It's a nested subcommand
                nested_info = main_info["subcommands"][main_sub]
                embed = discord.Embed(
                    title=f"⚙️ Mod: {main_name.title()} {main_sub.title()}",
                    description=nested_info["description"],
                    color=0x5865F2
                )
                
                usage_text = f"```\n{nested_info['usage']}\n{nested_info.get('slash', '')}\n```"
                embed.add_field(name="Usage", value=usage_text, inline=False)
                
                if nested_info.get("examples"):
                    examples_text = "\n".join(nested_info["examples"])
                    embed.add_field(name="Examples", value=f"```\n{examples_text}\n```", inline=False)
                
                embed.add_field(
                    name="Note",
                    value=f"Use `{prefix}help mod {main_name}` to see all {main_name} subcommands.",
                    inline=False
                )
                
                embed.set_footer(text=f"Use {prefix}help mod for all subcommands")
                embed.timestamp = discord.utils.utcnow()
                return [embed], 1
        
        # Subcommand not found - provide helpful error
        embed = discord.Embed(
            title="❌ Subcommand Not Found",
            description=f"Mod subcommand `{subcommand}` not found.\n\n"
                       f"**Available main subcommands:**\n" +
                       ", ".join([f"`{name}`" for name in MOD_SUBCOMMANDS.keys()]) +
                       f"\n\nUse `{prefix}help mod` to see all subcommands with pagination.\n"
                       f"Use `{prefix}help mod <subcommand>` for detailed help.",
            color=0xFF0000
        )
        return [embed], 1
    
    # Show paginated overview of all subcommands
    embeds = []
    subcommands_list = list(MOD_SUBCOMMANDS.items())
    items_per_page = 3  # Show 3 subcommands per page
    
    total_pages = (len(subcommands_list) + items_per_page - 1) // items_per_page
    
    for page in range(total_pages):
        start_idx = page * items_per_page
        end_idx = min(start_idx + items_per_page, len(subcommands_list))
        page_subcommands = subcommands_list[start_idx:end_idx]
        
        embed = discord.Embed(
            title="⚙️ Moderator Commands",
            description=f"Bot configuration commands (requires Manage Server permission)\n\n"
                       f"Use `{prefix}help mod <subcommand>` for detailed help on a specific subcommand.",
            color=0x5865F2
        )
        
        for sub_name, sub_info in page_subcommands:
            field_value = sub_info["description"]
            
            # Add subcommand list if it has nested subcommands
            if "subcommands" in sub_info:
                nested = ", ".join([f"`{n}`" for n in sub_info["subcommands"].keys()])
                field_value += f"\n**Subcommands:** {nested}"
            elif "usage" in sub_info:
                field_value += f"\n**Usage:** `{sub_info['usage']}`"
            
            embed.add_field(
                name=f"`{sub_name}`",
                value=field_value,
                inline=False
            )
        
        embed.set_footer(text=f"Page {page + 1} of {total_pages} • Use {prefix}help mod <subcommand> for details")
        embed.timestamp = discord.utils.utcnow()
        embeds.append(embed)
    
    return embeds, total_pages


async def handle_help_command(command_name: str = None, user: discord.Member = None, guild: discord.Guild = None) -> discord.Embed:
    """Handle help command. Returns embed with command information."""
    prefix = PREFIX
    
    # If specific command requested, show detailed help
    if command_name:
        command_name = command_name.lower().strip()
        
        # Handle mod command with subcommands (e.g., "mod channel" or "mod channel allow")
        if command_name == "mod" or command_name.startswith("mod "):
            # This will be handled in the command handler with pagination
            # Return a placeholder that will be replaced
            parts = command_name.split(maxsplit=1)
            if len(parts) > 1:
                subcommand = parts[1]
            else:
                subcommand = None
            
            # This will be handled in the command handler with pagination
            # For now, return a simple embed that will be replaced
            embed = discord.Embed(
                title="⚙️ Moderator Commands",
                description="Loading mod command help...",
                color=0x5865F2
            )
            return embed
        
        if command_name in COMMAND_INFO:
            info = COMMAND_INFO[command_name]
            
            # Check if it's a moderator command and user doesn't have permission
            if info.get("category") == "moderator":
                if not user or not guild:
                    embed = discord.Embed(
                        title="❌ Command Not Found",
                        description=f"Command `{command_name}` not found.",
                        color=0xFF0000
                    )
                    return embed
                from utils.permissions import has_mod_permission
                if not has_mod_permission(user, guild):
                    embed = discord.Embed(
                        title="❌ Permission Denied",
                        description=f"You need the **Manage Server** permission to view moderator commands.",
                        color=0xFF0000
                    )
                    return embed
            
            # Map command names to emojis and display names
            command_display = {
                "add": ("➕", "Add Process/Stage"),
                "delete": ("🗑️", "Delete Process"),
                "edit": ("✏️", "Edit Process"),
                "list": ("📋", "List Processes"),
                "dashboard": ("🌐", "Dashboard"),
                "help": ("❓", "Help"),
                "privacy": ("🔒", "Privacy Settings"),
                "anon": ("👤", "Anonymous Mode"),
                "sankey": ("📊", "Sankey Diagram"),
                "mod": ("⚙️", "Moderator Commands")
            }
            
            emoji, display_name = command_display.get(command_name, ("📚", command_name.title()))
            
            embed = discord.Embed(
                title=f"{emoji} {display_name}",
                description="",
                color=0x5865F2
            )
            
            # Usage section
            usage_text = f"```\n{info['usage']}\n{info.get('slash', '')}\n```"
            embed.add_field(
                name="Usage",
                value=usage_text,
                inline=False
            )
            
            # Description
            embed.add_field(
                name="Description",
                value=info["description"],
                inline=False
            )
            
            # Examples
            if info.get("examples"):
                examples_text = "\n".join(info["examples"])
                embed.add_field(
                    name="Examples",
                    value=f"```\n{examples_text}\n```",
                    inline=False
                )
            
            # Build footer with category and note if available
            footer_parts = [f"Category: {info['category']}", f"Use {prefix}help for all commands"]
            if info.get("notes"):
                footer_parts.append(f"💡 {info['notes']}")
            
            embed.set_footer(text=" • ".join(footer_parts))
            embed.timestamp = discord.utils.utcnow()
            return embed
        else:
            # Command not found
            embed = discord.Embed(
                title="❌ Command Not Found",
                description=f"Command `{command_name}` not found.\n\n"
                           f"Use `{prefix}help` to see all available commands.",
                color=0xFF0000
            )
            return embed
    
    # General overview - quick rundown
    embed = discord.Embed(
        title="📚 Process",
        description=f"All commands\n"
                   f"Get information about a specific command with `{prefix}help COMMAND_NAME`\n"
                   f"Use slash commands (`/`) for autocomplete suggestions!",
        color=0x5865F2
    )
    
    # Group commands by category dynamically from COMMAND_INFO
    categories = {}
    for cmd_name, cmd_info in COMMAND_INFO.items():
        category = cmd_info.get("category", "misc")
        
        # Only show moderator commands to users with Manage Server permission
        if category == "moderator":
            if not user or not guild:
                continue
            from utils.permissions import has_mod_permission
            if not has_mod_permission(user, guild):
                continue
        
        if category not in categories:
            categories[category] = []
        categories[category].append(cmd_name)
    
    # Display categories in a specific order
    category_order = ["processes", "account", "settings", "analytics", "moderator", "misc"]
    for category in category_order:
        if category in categories:
            commands = categories[category]
            command_list = ", ".join([f"`{cmd}`" for cmd in commands])
            embed.add_field(
                name=category.title(),
                value=command_list,
                inline=False
            )
    
    # Add any remaining categories not in the order list
    for category, commands in categories.items():
        if category not in category_order:
            command_list = ", ".join([f"`{cmd}`" for cmd in commands])
            embed.add_field(
                name=category.title(),
                value=command_list,
                inline=False
            )
    
    # Legacy command
    embed.add_field(
        name="legacy",
        value="`!process` (translates to add)",
        inline=False
    )
    
    embed.set_footer(text=f"Prefix: {prefix} | Use {prefix}help <command> for details")
    embed.timestamp = discord.utils.utcnow()
    
    return embed


def setup_help_command(bot: commands.Bot):
    """Setup help command (both slash and prefix)."""
    
    # Slash command
    @bot.tree.command(name="help", description="Show all available bot commands or get help for a specific command")
    @app_commands.describe(command="Name of the command to get detailed help for")
    async def help_slash(interaction: discord.Interaction, command: str = None):
        """Help command: /help [command]"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="help",
            user_id=discord_id,
            username=username,
            raw_args=command if command else None
        )
        
        user = interaction.user
        guild = interaction.guild
        
        # Handle mod command help with pagination
        if command and (command.lower() == "mod" or command.lower().startswith("mod ")):
            parts = command.lower().split(maxsplit=1)
            subcommand = parts[1] if len(parts) > 1 else None
            embeds, total_pages = await handle_mod_help(subcommand, user, guild)
            
            if total_pages > 1:
                view = ModHelpView(embeds, total_pages)
                await interaction.response.send_message(embed=embeds[0], view=view)
            else:
                await interaction.response.send_message(embed=embeds[0])
        else:
            embed = await handle_help_command(command, user, guild)
            await interaction.response.send_message(embed=embed)
    
    # Prefix command
    @bot.command(name="help", aliases=["h"])
    async def help_prefix(ctx: commands.Context, command_name: str = None):
        """Help command: p!help [command_name]"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="help",
            user_id=discord_id,
            username=username,
            raw_args=command_name if command_name else None
        )
        
        user = ctx.author
        guild = ctx.guild
        
        # Handle mod command help with pagination
        if command_name and (command_name.lower() == "mod" or command_name.lower().startswith("mod ")):
            parts = command_name.lower().split(maxsplit=1)
            subcommand = parts[1] if len(parts) > 1 else None
            embeds, total_pages = await handle_mod_help(subcommand, user, guild)
            
            if total_pages > 1:
                view = ModHelpView(embeds, total_pages)
                await ctx.send(embed=embeds[0], view=view)
            else:
                await ctx.send(embed=embeds[0])
        else:
            embed = await handle_help_command(command_name, user, guild)
            await ctx.send(embed=embed)

