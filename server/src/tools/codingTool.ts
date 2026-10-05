import FileChange from "../models/FileChange.js";
import {
    getFile,
} from "./githubTool.js";
import {
    generateDiff,
    countChanges
} from "../services/diffService.js";

export const editFile = async (
    runId: string,
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    newContent: string
) => {
    const file = await getFile(
        accessToken,
        owner,
        repo,
        path
    );

    const oldContent = file.content;

    const diff = generateDiff(
        path,
        oldContent,
        newContent
    );

    const {
        additions,
        deletions
    } = countChanges(diff);

    const change = await FileChange.create({
        runId,
        filePath: path,
        changeType: "MODIFIED",
        oldContent,
        newContent,
        additions,
        deletions,
        diff,
        status: "PENDING"
    });

    return {
        success: true,
        changeId: change._id.toString(),
        filePath: path,
        changeType: "MODIFIED",
        additions,
        deletions,
        status: "PENDING",
        diff
    };
};

export const createFile = async (
    runId: string,
    path: string,
    newContent: string
) => {
    const oldContent = "";

    const diff = generateDiff(
        path,
        oldContent,
        newContent
    );

    const {
        additions,
        deletions
    } = countChanges(diff);

    const change = await FileChange.create({
        runId,
        filePath: path,
        changeType: "ADDED",
        oldContent,
        newContent,
        additions,
        deletions,
        diff,
        status: "PENDING"
    });

    return {
        success: true,
        changeId: change._id.toString(),
        filePath: path,
        changeType: "ADDED",
        additions,
        deletions,
        status: "PENDING",
        diff
    };
};

export const deleteFile = async (
    runId: string,
    accessToken: string,
    owner: string,
    repo: string,
    path: string
) => {
    const file = await getFile(
        accessToken,
        owner,
        repo,
        path
    );

    const oldContent = file.content;
    const newContent = "";

    const diff = generateDiff(
        path,
        oldContent,
        newContent
    );

    const {
        additions,
        deletions
    } = countChanges(diff);

    const change = await FileChange.create({
        runId,
        filePath: path,
        changeType: "DELETED",
        oldContent,
        newContent,
        additions,
        deletions,
        diff,
        status: "PENDING"
    });

    return {
        success: true,
        changeId: change._id.toString(),
        filePath: path,
        changeType: "DELETED",
        additions,
        deletions,
        status: "PENDING",
        diff
    };
};