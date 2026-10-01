import axios from "axios";

const githubApi = axios.create({
    baseURL: "https://api.github.com",
    headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10"
    }
});


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
                Authorization: `Bearer ${accessToken}`
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