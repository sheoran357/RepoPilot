import { getRepositoryContents } from "../services/githubService.js";

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