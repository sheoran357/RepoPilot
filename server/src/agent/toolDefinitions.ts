export const toolDefinitions = [

    {
        name: "search_code",
        description:
            "Search the repository for a function, class, variable, text, or other code.",
        parameters: {
            searchTerm: "string"
        }
    },

    {
        name: "get_file",
        description:
            "Read the complete contents of a file from the repository.",
        parameters: {
            path: "string"
        }
    },

    {
        name: "list_files",
        description:
            "List files and folders in the repository. An optional path can be provided to inspect a specific directory.",
        parameters: {
            path: "string (optional)"
        }
    },

    {
        name: "edit_file",
        description:
            "Propose a modification to an existing file. The complete new file content must be provided.",
        parameters: {
            path: "string",
            newContent: "string"
        }
    },

    {
        name: "create_file",
        description:
            "Propose creation of a new file. The complete file content must be provided.",
        parameters: {
            path: "string",
            newContent: "string"
        }
    },

    {
        name: "delete_file",
        description:
            "Propose deletion of an existing file.",
        parameters: {
            path: "string"
        }
    },

    {
        name: "run_command",
        description:
            "Run an allowed development command inside the configured execution workspace and return stdout, stderr, exit code, and duration.",
        parameters: {
            command: "string"
        }
    }

];
