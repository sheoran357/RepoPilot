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
            "List files and folders in the repository root.",
        parameters: {}
    }
];