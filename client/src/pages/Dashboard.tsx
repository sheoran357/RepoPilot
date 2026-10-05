import { useEffect, useState } from "react";
import api from "../services/api.js";

interface User {
    username: string;
    avatarUrl?: string;
}

interface Repository {
    _id: string;
    name: string;
    fullName: string;
    url: string;
    defaultBranch: string;
}

interface Execution {
    command: string;
    status: string;
    stdout?: string;
    stderr?: string;
    exitCode?: number | null;
    duration?: number;
}

const Dashboard = () => {
    const [user, setUser] =
        useState<User | null>(null);

    const [repositories, setRepositories] =
        useState<Repository[]>([]);

    const [selectedRepositoryId, setSelectedRepositoryId] =
        useState("");

    const [title, setTitle] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [loadingRepositories, setLoadingRepositories] =
        useState(false);

    const [running, setRunning] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [execution, setExecution] =
        useState<Execution | null>(null);

    const loadUser = async () => {
        try {
            const response =
                await api.get("/auth/me");

            setUser(response.data.user);
        } catch (error) {
            console.error(
                "Failed to load user:",
                error
            );
        }
    };

    const loadRepositories = async () => {
        setLoadingRepositories(true);

        try {
            const response =
                await api.get(
                    "/github/repositories"
                );

            const repos =
                response.data.repositories || [];

            setRepositories(repos);

            if (
                repos.length > 0 &&
                !selectedRepositoryId
            ) {
                setSelectedRepositoryId(
                    repos[0]._id
                );
            }
        } catch (error) {
            console.error(
                "Failed to load repositories:",
                error
            );

            setMessage(
                "Failed to load repositories."
            );
        } finally {
            setLoadingRepositories(false);
        }
    };

    const syncRepositories = async () => {
        setLoadingRepositories(true);
        setMessage("");

        try {
            const response =
                await api.post(
                    "/github/repositories/sync"
                );

            const repos =
                response.data.repositories || [];

            setRepositories(repos);

            if (repos.length > 0) {
                setSelectedRepositoryId(
                    repos[0]._id
                );
            }

            setMessage(
                `Synced ${repos.length} repositories.`
            );
        } catch (error) {
            console.error(
                "Failed to sync repositories:",
                error
            );

            setMessage(
                "Failed to sync repositories."
            );
        } finally {
            setLoadingRepositories(false);
        }
    };

    const runTask = async () => {
        if (
            !selectedRepositoryId ||
            !title.trim() ||
            !description.trim()
        ) {
            setMessage(
                "Select a repository and enter a task title and description."
            );
            return;
        }

        setRunning(true);
        setExecution(null);
        setMessage("Creating task and starting agent...");

        try {
            const taskResponse =
                await api.post(
                    "/tasks",
                    {
                        repositoryId:
                            selectedRepositoryId,
                        title: title.trim(),
                        description:
                            description.trim()
                    }
                );

            const taskId =
                taskResponse.data.task._id;

            const runResponse =
                await api.post(
                    "/agent-runs/run",
                    {
                        taskId
                    }
                );

            const runId =
                runResponse.data.agentRun.runId;

            const executionResponse =
                await api.get(
                    `/executions/runs/${runId}`
                );

            setExecution(
                executionResponse.data.execution
            );

            setMessage(
                "Agent run completed."
            );
        } catch (error: any) {
            console.error(
                "Agent run failed:",
                error
            );

            const responseMessage =
                error?.response?.data?.message;

            setMessage(
                responseMessage ||
                "Agent run failed."
            );
        } finally {
            setRunning(false);
        }
    };

    useEffect(() => {
        loadUser();
        loadRepositories();
    }, []);

    return (
        <div
            style={{
                maxWidth: "900px",
                margin: "0 auto",
                padding: "40px 24px"
            }}
        >
            <h1>RepoPilot Dashboard</h1>

            {user && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "32px"
                    }}
                >
                    {user.avatarUrl && (
                        <img
                            src={user.avatarUrl}
                            alt="GitHub avatar"
                            width="64"
                            height="64"
                            style={{
                                borderRadius: "50%"
                            }}
                        />
                    )}

                    <div>
                        <h2
                            style={{
                                margin: 0
                            }}
                        >
                            Welcome, {user.username}
                        </h2>

                        <p>
                            Create a task and let RepoPilot
                            run it in a managed workspace.
                        </p>
                    </div>
                </div>
            )}

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "24px",
                    marginBottom: "24px"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px"
                    }}
                >
                    <h2>Repositories</h2>

                    <button
                        type="button"
                        onClick={syncRepositories}
                        disabled={loadingRepositories}
                    >
                        {loadingRepositories
                            ? "Syncing..."
                            : "Sync GitHub"}
                    </button>
                </div>

                {repositories.length === 0 ? (
                    <p>
                        No repositories found. Click
                        "Sync GitHub" to load your
                        repositories.
                    </p>
                ) : (
                    <select
                        value={selectedRepositoryId}
                        onChange={(event) =>
                            setSelectedRepositoryId(
                                event.target.value
                            )
                        }
                        style={{
                            width: "100%",
                            padding: "10px"
                        }}
                    >
                        {repositories.map(
                            (repository) => (
                                <option
                                    key={repository._id}
                                    value={repository._id}
                                >
                                    {repository.fullName}
                                </option>
                            )
                        )}
                    </select>
                )}
            </section>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "24px",
                    marginBottom: "24px"
                }}
            >
                <h2>Create Task</h2>

                <label>
                    Task title
                    <input
                        value={title}
                        onChange={(event) =>
                            setTitle(event.target.value)
                        }
                        placeholder="Run node --version"
                        style={{
                            display: "block",
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "10px",
                            marginTop: "6px",
                            marginBottom: "16px"
                        }}
                    />
                </label>

                <label>
                    Task description
                    <textarea
                        value={description}
                        onChange={(event) =>
                            setDescription(
                                event.target.value
                            )
                        }
                        placeholder="Run node --version in the repository workspace. Do not modify any files."
                        rows={5}
                        style={{
                            display: "block",
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "10px",
                            marginTop: "6px",
                            marginBottom: "16px"
                        }}
                    />
                </label>

                <button
                    type="button"
                    onClick={runTask}
                    disabled={running}
                >
                    {running
                        ? "Running agent..."
                        : "Create Task & Run Agent"}
                </button>

                {message && (
                    <p
                        style={{
                            marginTop: "16px"
                        }}
                    >
                        {message}
                    </p>
                )}
            </section>

            {execution && (
                <section
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "24px"
                    }}
                >
                    <h2>Execution Result</h2>

                    <p>
                        <strong>Command:</strong>{" "}
                        {execution.command}
                    </p>

                    <p>
                        <strong>Status:</strong>{" "}
                        {execution.status}
                    </p>

                    <p>
                        <strong>Exit code:</strong>{" "}
                        {execution.exitCode ?? "null"}
                    </p>

                    <p>
                        <strong>Duration:</strong>{" "}
                        {execution.duration ?? 0} ms
                    </p>

                    <h3>stdout</h3>

                    <pre
                        style={{
                            background: "#f5f5f5",
                            padding: "16px",
                            overflowX: "auto"
                        }}
                    >
                        {execution.stdout || "(empty)"}
                    </pre>

                    <h3>stderr</h3>

                    <pre
                        style={{
                            background: "#f5f5f5",
                            padding: "16px",
                            overflowX: "auto"
                        }}
                    >
                        {execution.stderr || "(empty)"}
                    </pre>
                </section>
            )}
        </div>
    );
};

export default Dashboard;
