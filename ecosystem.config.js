module.exports = {
    apps: [
        {
            name: "DiscordBot",
            cwd: "./DiscDJBotServer/",
            script: "./index.js",
            watch: ".",
            env_production: {},
            env_development: {},
        },
        {
            name: "ActiveUsers",
            cwd: "./DiscDJActiveUsers/",
            script: "./index.js",
            watch: ".",
            env_production: {},
            env_development: {},
        },
        {
            name: "Guilds",
            cwd: "./DiscDJGuilds/",
            script: "./index.js",
            watch: ".",
            env_production: {},
            env_development: {},
        },
        {
            name: "PostgresAccess",
            cwd: "./DiscDJPostgresAccess/",
            script: "./index.js",
            watch: ".",
            env_production: {},
            env_development: {},
        },
        {
            name: "Queue",
            cwd: "./DiscDJQueue/",
            script: "./index.js",
            watch: ".",
            env_production: {},
            env_development: {},
        },
        {
            name: "Songs",
            cwd: "./DiscDJSongs/",
            script: "./index.js",
            watch: ".",
            env_production: {},
            env_development: {},
        },

        {
            name: "Scores",
            cwd: "./DiscDJScores/",
            script: "./index.js",
            watch: ".",
            env_production: {},
            env_development: {},
        },
    ],

    deploy: {
        production: {
            user: "SSH_USERNAME",
            host: "SSH_HOSTMACHINE",
            ref: "origin/master",
            repo: "GIT_REPOSITORY",
            path: "DESTINATION_PATH",
            "pre-deploy-local": "",
            "post-deploy":
                "npm install && pm2 reload ecosystem.config.js --env production",
            "pre-setup": "",
        },
    },
};
