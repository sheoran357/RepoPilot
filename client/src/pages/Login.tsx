const Login = () => {
    const loginWithGithub = () => {
        window.location.href =
            "http://localhost:5000/api/auth/github";
    };

    return (
        <div>
            <h1>RepoPilot</h1>

            <p>
                AI-powered software engineering agent
            </p>

            <button onClick={loginWithGithub}>
                Continue with GitHub
            </button>
        </div>
    );
};

export default Login;