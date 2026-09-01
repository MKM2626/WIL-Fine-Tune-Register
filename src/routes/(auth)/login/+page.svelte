<script lang="ts">
    import { authClient } from "#lib/auth-client";

    async function login() {
        await authClient.signIn.social({
            provider: "github",
            callbackURL: "/"
        });
    }

</script>

<div>
    <h1>Login</h1>
    <button type="button" onclick={login}>
        Continue with GitHub
    </button>

    <button onclick={async () => {
        await authClient.signOut({callbackURL: "http://localhost:5173"})
    }}>
    logout
    </button>
</div>