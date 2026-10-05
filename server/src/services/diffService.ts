import { createPatch } from "diff";

export const generateDiff = (
    filePath: string,
    oldContent: string,
    newContent: string
) => {
    return createPatch(
        filePath,
        oldContent,
        newContent,
        "before",
        "after"
    );
};

export const countChanges = (diff: string) => {
    const lines = diff.split("\n");

    let additions = 0;
    let deletions = 0;

    for (const line of lines) {
        if (
            line.startsWith("+") &&
            !line.startsWith("+++")
        ) {
            additions++;
        }

        if (
            line.startsWith("-") &&
            !line.startsWith("---")
        ) {
            deletions++;
        }
    }

    return {
        additions,
        deletions
    };
};