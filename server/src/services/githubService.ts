import axios from "axios";

const githubApi = axios.create({
    baseURL: "https://api.github.com",
    headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10"
    }
});


export const createGithubFile = async (
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string
) => {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            method: "PUT",

            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28"
            },

            body: JSON.stringify({
                message,
                content: Buffer.from(content).toString("base64")
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            `GitHub create file failed: ${error}`
        );
    }

    return await response.json();
};

export const updateGithubFile = async (
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    sha: string,
    message: string
) => {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            method: "PUT",

            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28"
            },

            body: JSON.stringify({
                message,
                content: Buffer.from(content).toString("base64"),
                sha
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            `GitHub update file failed: ${error}`
        );
    }

    return await response.json();
};

export const deleteGithubFile = async (
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    sha: string,
    message: string
) => {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            method: "DELETE",

            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28"
            },

            body: JSON.stringify({
                message,
                sha
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            `GitHub delete file failed: ${error}`
        );
    }

    return await response.json();
};

export const searchGithubCode = async (
    accessToken: string,
    owner: string,
    repo: string,
    searchTerm: string
) => {
    const response = await githubApi.get(
        "/search/code",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json"
            },
            params: {
                q: `${searchTerm} repo:${owner}/${repo}`,
                per_page: 50
            }
        }
    );

    return response.data;
};

export const getRepositoryContents = async (
    accessToken: string,
    owner: string,
    repo: string,
    path: string = ""
) => {
    const response = await githubApi.get(
        `/repos/${owner}/${repo}/contents/${path}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    return response.data;
};

export const getGithubUser = async (
    accessToken: string
) => {
    const response = await githubApi.get("/user", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.data;
};

export const getGithubRepository = async (
    accessToken: string,
    owner: string,
    repo: string
) => {
    const response = await githubApi.get(
        `/repos/${owner}/${repo}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    return response.data;
};


export const getRepositoryIssues = async (
    accessToken: string,
    owner: string,
    repo: string
) => {
    const response = await githubApi.get(
        `/repos/${owner}/${repo}/issues`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            params: {
                state: "open",
                per_page: 100
            }
        }
    );

    return response.data;
};

export const getGithubRepositories = async (
    accessToken: string
) => {
    const response = await githubApi.get(
        "/user/repos",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            params: {
                per_page: 100,
                sort: "updated"
            }
        }
    );

    return response.data;
};

export const getRepositoryFile = async (
    accessToken: string,
    owner: string,
    repo: string,
    path: string
) => {
    const response = await githubApi.get(
        `/repos/${owner}/${repo}/contents/${path}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    return response.data;
};