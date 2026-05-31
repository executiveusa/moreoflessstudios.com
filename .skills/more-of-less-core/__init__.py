"""More-of-Less Core Skill

A comprehensive system prompt and orchestration framework for the More-of-Less
personal AI studio platform. Provides:

- HART (Heart & Soul): Agent identity, values, goals, ethical code
- SPEC: Complete specification for architecture, APIs, UI/UX, roadmap
- ARCHITECTURE: System design, data models, provider routing
- AGENTS: Multi-agent role definitions and interaction patterns
- TEST_SPEC: Validation checklist for spec compliance

Usage:
    from skills.more_of_less_core import MoreOfLessAgent

    agent = MoreOfLessAgent(
        user_email="artist@example.com",
        language="en",
        mode="studio"
    )

    # Register sub-agents
    agent.register_skill("audio-agent", AudioAgent)
    agent.register_skill("video-agent", VideoAgent)

    # Process creative request
    project = agent.process_request(
        user_input="Create a music video for my track 'Midnight Run'",
        context={"song_id": "track_123", "style": "cyberpunk"}
    )

Classes:
    MoreOfLessAgent: Main orchestrator for the More-of-Less platform
    ProjectManager: Handles project lifecycle
    JobQueue: Manages async media processing jobs
    CostTracker: Logs and enforces budget constraints
    AnalyticsEngine: Learns user preferences and builds knowledge graph

Constants:
    HART: Heart and soul file (identity and values)
    SPEC: Full specification document
    TEST_SPEC: Validation checklist

Author: More-of-Less Team
License: See LICENSE file
"""

__version__ = "0.1.0"
__all__ = [
    "MoreOfLessAgent",
    "ProjectManager",
    "JobQueue",
    "CostTracker",
    "AnalyticsEngine",
    "HART",
    "SPEC",
    "TEST_SPEC",
]


class MoreOfLessAgent:
    """Main orchestrator for the More-of-Less platform.

    Coordinates sub-agents, manages projects, enforces budget and ethical
    constraints, and provides a conversational interface for creators.
    """

    def __init__(self, user_email: str, language: str = "en", mode: str = "studio"):
        """Initialize the More-of-Less agent.

        Args:
            user_email: User's email address for authentication
            language: Preferred language ("en" or "es")
            mode: Operating mode ("studio" or "assistant")
        """
        self.user_email = user_email
        self.language = language
        self.mode = mode
        self.skills = {}
        self.projects = {}
        self.memory = {}

    def register_skill(self, skill_name: str, skill_class):
        """Register a sub-agent skill.

        Args:
            skill_name: Identifier for the skill (e.g. "audio-agent")
            skill_class: Agent class to instantiate
        """
        self.skills[skill_name] = skill_class()

    def process_request(self, user_input: str, context: dict = None) -> dict:
        """Process a creative request from the user.

        Args:
            user_input: User's request (voice or text)
            context: Additional context (song_id, style, etc.)

        Returns:
            Project object with status and next steps
        """
        # Parse intent
        # Coordinate sub-agents
        # Return project result
        pass

    def log_decision(self, decision: dict):
        """Log a decision for audit and learning."""
        pass

    def escalate(self, message: str, options: list = None) -> str:
        """Escalate a decision to the user."""
        pass


class ProjectManager:
    """Manages project lifecycle (creation, modification, deletion)."""
    pass


class JobQueue:
    """Manages async media processing jobs with progress tracking."""
    pass


class CostTracker:
    """Logs costs and enforces budget constraints."""
    pass


class AnalyticsEngine:
    """Learns user preferences and builds knowledge graph."""
    pass


# Load spec documents
HART = None  # Loaded from HART.md
SPEC = None  # Loaded from SPEC.md
TEST_SPEC = None  # Loaded from TEST_SPEC.md
