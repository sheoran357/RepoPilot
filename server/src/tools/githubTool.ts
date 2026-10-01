import {
    getRepositoryContents,
    getRepositoryFile,
    searchGithubCode
} from "../services/githubService.js";


export const searchCode = async (
    accessToken: string,
    owner: string,
    repo: string,
    searchTerm: string
) => {
    const result = await searchGithubCode(
        accessToken,
        owner,
        repo,
        searchTerm
    );

    return result.items.map((item: any) => ({
        name: item.name,
        path: item.path,
        url: item.html_url
    }));
};


export const listRepositoryFiles = async (
    accessToken: string,
    owner: string,
    repo: string
) => {
    const contents = await getRepositoryContents(
        accessToken,
        owner,
        repo
    );

    return contents.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type
    }));
};

export const getFile = async (
    accessToken: string,
    owner: string,
    repo: string,
    path: string
) => {
    const file = await getRepositoryFile(
        accessToken,
        owner,
        repo,
        path
    );

    if (file.type !== "file") {
        throw new Error("The requested path is not a file");
    }

    const content = Buffer.from(
        file.content,
        "base64"
    ).toString("utf-8");

    return {
        name: file.name,
        path: file.path,
        content
    };
};