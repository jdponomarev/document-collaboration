module.exports = {
	apps: [
		{
			name: "Alphasense",
			script: "index.js",
			args: "one two",
			instances: 1,
			autorestart: true,
			watch: true,
		},
	],
};
