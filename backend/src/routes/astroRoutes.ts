import { Router } from "express";

const router = Router();

const celestialObjects: Record<string, object> = {
    mercury: {
        name: "Mercury",
        type: "Planet",
        description: "The smallest planet and the closest planet to the Sun.",
        distance: "77 million km from Earth (average)"
    },

    venus: {
        name: "Venus",
        type: "Planet",
        description: "The second planet from the Sun and the hottest planet in our Solar System.",
        distance: "41 million km from Earth (average)"
    },

    earth: {
        name: "Earth",
        type: "Planet",
        description: "The third planet from the Sun and our home planet.",
        distance: "149.6 million km from the Sun"
    },

    moon: {
        name: "Moon",
        type: "Natural Satellite",
        description: "Earth's natural satellite.",
        distance: "384,400 km from Earth"
    },

    mars: {
        name: "Mars",
        type: "Planet",
        description: "The fourth planet from the Sun, known as the Red Planet.",
        distance: "225 million km from Earth (average)"
    },

    jupiter: {
        name: "Jupiter",
        type: "Planet",
        description: "The largest planet in our Solar System.",
        distance: "778 million km from the Sun (average)"
    },

    saturn: {
        name: "Saturn",
        type: "Planet",
        description: "The sixth planet from the Sun, famous for its spectacular ring system.",
        distance: "1.4 billion km from the Sun (average)"
    },

    uranus: {
        name: "Uranus",
        type: "Planet",
        description: "The seventh planet from the Sun and an ice giant.",
        distance: "2.9 billion km from the Sun (average)"
    },

    neptune: {
        name: "Neptune",
        type: "Planet",
        description: "The eighth and farthest known planet from the Sun.",
        distance: "4.5 billion km from the Sun (average)"
    },

    sun: {
        name: "Sun",
        type: "Star",
        description: "The star at the center of our Solar System.",
        distance: "149.6 million km from Earth"
    }
};

router.get("/status", (req, res) => {
    res.json({
        success: true,
        message: "AstroTrack API is working 🚀"
    });
});

router.get("/object/:name", (req, res) => {
    const name = req.params.name.toLowerCase();

    const object = celestialObjects[name];

    if (!object) {
        return res.status(404).json({
            success: false,
            message: "Celestial object not found"
        });
    }

    res.json({
        success: true,
        data: object
    });
});

export default router;