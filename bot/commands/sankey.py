"""Sankey diagram command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import os
import io
from typing import Optional

from utils.auth import get_user_token, api_request
from utils.embeds import create_info_embed, create_error_embed
from utils.errors import handle_command_error
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


async def handle_sankey_command(discord_id: str, username: str) -> tuple[discord.Embed, Optional[discord.File]]:
    """Handle sankey command. Returns embed and optional image file."""
    try:
        token = await get_user_token(discord_id, username)
        
        # Get all processes
        processes = await api_request("GET", "/api/processes/", token)
        
        # Filter for public processes only
        public_processes = [p for p in processes if p.get("is_public") and p.get("share_id")]
        
        if not public_processes:
            return create_error_embed(
                "No Public Processes",
                "You don't have any public processes. Make some processes public to generate a Sankey diagram.",
                fields=[{
                    "name": "How to make processes public",
                    "value": "Use the website dashboard or `p!edit <company> privacy public`",
                    "inline": False
                }]
            ), None
        
        # Get process details for all public processes
        process_details = []
        for process in public_processes:
            try:
                detail = await api_request("GET", f"/api/processes/{process['id']}/detail", token)
                process_details.append(detail)
            except Exception:
                continue  # Skip if we can't get details
        
        if not process_details:
            return create_error_embed(
                "No Process Data",
                "Unable to retrieve process details for your public processes."
            ), None
        
        # Transform to Sankey data
        sankey_data = transform_processes_to_sankey(public_processes, process_details)
        
        if not sankey_data["nodes"] or not sankey_data["links"]:
            return create_error_embed(
                "Insufficient Data",
                "Not enough stage transitions to generate a Sankey diagram. Add more stages to your processes."
            ), None
        
        # Generate Sankey diagram image
        try:
            image_file = generate_sankey_image(sankey_data)
        except ImportError:
            # If plotting library not available, return text representation
            return create_info_embed(
                "Sankey Diagram",
                "Sankey diagram generation requires additional dependencies. Please use the website dashboard to view your Sankey diagram.",
                fields=[{
                    "name": "View on Website",
                    "value": f"Visit your dashboard and go to Analytics view to see the Sankey diagram.",
                    "inline": False
                }]
            ), None
        except Exception as e:
            return create_error_embed(
                "Generation Error",
                f"Failed to generate Sankey diagram: {str(e)}"
            ), None
        
        # Create embed with the image
        embed = discord.Embed(
            title="📊 Sankey Diagram",
            description=f"Stage flow visualization for {len(public_processes)} public process{'es' if len(public_processes) != 1 else ''}",
            color=0x5865F2
        )
        embed.set_image(url="attachment://sankey.png")
        embed.timestamp = discord.utils.utcnow()
        
        return embed, image_file
        
    except Exception as e:
        return handle_command_error(e, "generating Sankey diagram"), None


def transform_processes_to_sankey(processes, process_details):
    """Transform process data into Sankey format."""
    # Create a map for quick lookup
    process_details_map = {pd["id"]: pd for pd in process_details}
    
    # Track all unique stage names and transitions
    node_set = set()
    node_count_map = {}  # stage name -> total count
    link_map = {}  # "source->target" -> count
    
    # Analyze each process to get actual stage transitions
    for process in processes:
        detail = process_details_map.get(process["id"])
        stages = detail.get("stages", []) if detail else []
        
        if not stages:
            continue
        
        # Sort stages by date to get chronological order
        sorted_stages = sorted(stages, key=lambda s: s.get("stage_date", ""))
        
        # Add all stage names to node set and count occurrences
        for stage in sorted_stages:
            stage_name = stage.get("stage_name")
            if stage_name:
                node_set.add(stage_name)
                node_count_map[stage_name] = node_count_map.get(stage_name, 0) + 1
        
        # Count transitions between consecutive stages
        for i in range(len(sorted_stages) - 1):
            source = sorted_stages[i].get("stage_name")
            target = sorted_stages[i + 1].get("stage_name")
            if source and target:
                key = f"{source}->{target}"
                link_map[key] = link_map.get(key, 0) + 1
    
    # Order nodes by typical flow
    stage_order = [
        'Applied',
        'OA',
        'Phone Screen',
        'Technical Interview',
        'HM Interview',
        'Final Interview',
        'On-site Interview',
        'Take-home Assignment',
        'System Design',
        'Behavioral Interview',
        'Coding Challenge',
        'Offer',
        'Reject',
        'Other',
    ]
    
    # Create nodes array - ordered by typical flow, then any others
    ordered_nodes = [s for s in stage_order if s in node_set]
    other_nodes = [s for s in node_set if s not in stage_order]
    nodes = [{"name": name, "count": node_count_map.get(name, 0)} for name in ordered_nodes + other_nodes]
    
    # Create node index map
    node_index_map = {node["name"]: idx for idx, node in enumerate(nodes)}
    
    # Create links array from actual transitions
    links = []
    for key, value in link_map.items():
        source, target = key.split("->")
        source_index = node_index_map.get(source)
        target_index = node_index_map.get(target)
        
        if source_index is not None and target_index is not None:
            links.append({
                "source": source_index,
                "target": target_index,
                "value": value
            })
    
    return {"nodes": nodes, "links": links}


def generate_sankey_image(sankey_data):
    """Generate a Sankey diagram image using plotly."""
    try:
        import plotly.graph_objects as go
        import plotly.io as pio
    except ImportError:
        raise ImportError("plotly is required for Sankey diagram generation. Install with: pip install plotly kaleido")
    
    nodes = sankey_data["nodes"]
    links = sankey_data["links"]
    
    if not nodes or not links:
        raise ValueError("No data to visualize")
    
    # Stage colors matching the frontend
    COLORS = {
        'Applied': '#FDE68A',
        'OA': '#3B82F6',
        'Phone Screen': '#60A5FA',
        'Technical Interview': '#818CF8',
        'HM Interview': '#A78BFA',
        'Final Interview': '#C084FC',
        'On-site Interview': '#E879F9',
        'Take-home Assignment': '#F472B6',
        'System Design': '#FB7185',
        'Behavioral Interview': '#F87171',
        'Coding Challenge': '#EF4444',
        'Offer': '#10B981',
        'Reject': '#EF4444',
        'Other': '#6B7280',
    }
    
    # Prepare data for plotly Sankey - include count in label
    node_labels = []
    node_colors = []
    for node in nodes:
        name = node["name"]
        count = node.get("count", 0)
        # Format: count on top, name below (using newline)
        node_labels.append(f"{count}\n{name}")
        node_colors.append(COLORS.get(name, '#8884d8'))
    
    # Create Sankey diagram
    fig = go.Figure(data=[go.Sankey(
        node=dict(
            label=node_labels,
            color=node_colors,
        ),
        link=dict(
            source=[link["source"] for link in links],
            target=[link["target"] for link in links],
            value=[link["value"] for link in links],
        )
    )])
    
    fig.update_layout(
        title_text="Stage Flow (Sankey Diagram)",
        font_size=12,
        height=600,
        width=1000,
    )
    
    # Convert to image bytes
    img_bytes = pio.to_image(fig, format="png", width=1000, height=600, engine="kaleido")
    
    # Create Discord file
    file = discord.File(io.BytesIO(img_bytes), filename="sankey.png")
    
    return file


def setup_sankey_command(bot: commands.Bot):
    """Setup sankey command (both slash and prefix)."""
    
    # Slash command
    @bot.tree.command(name="sankey", description="Generate a Sankey diagram of your public processes")
    async def sankey_slash(interaction: discord.Interaction):
        """Sankey command: /sankey"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="sankey",
            user_id=discord_id,
            username=username,
        )
        
        await interaction.response.defer()
        embed, image_file = await handle_sankey_command(discord_id, username)
        
        if image_file:
            await interaction.followup.send(embed=embed, file=image_file)
        else:
            await interaction.followup.send(embed=embed)
    
    # Prefix command
    @bot.command(name="sankey")
    async def sankey_prefix(ctx: commands.Context):
        """Sankey command: p!sankey"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="sankey",
            user_id=discord_id,
            username=username,
        )
        
        embed, image_file = await handle_sankey_command(discord_id, username)
        
        if image_file:
            await ctx.send(embed=embed, file=image_file)
        else:
            await ctx.send(embed=embed)

