<script lang="ts">
    import { authClient } from "#lib/auth-client";

    async function login() {
        await authClient.signIn.social({
            provider: "github",
            callbackURL: "/"
        });
    }

</script>



<div class='flex min-h-screen items-center justify-center bg-bg-dark px-20 text-text'>
    <div class='flex flex-col py-10 w-80 h-fit bg-bg rounded-lg shadow-2xl items-center justify-center'>
        <h1 class='text-3xl'>
            Sign In
        </h1>


        <!-- <div class="border-2 mt-20 w-50 border-bg-light rounded-lg"></div> -->


        <button 
            class="bg-action/75  mt-20 mb-10 px-4 py-2 rounded-lg border border-border hover:brightness-125 hover:text-text"
            type="button" 
            onclick={login}
        >
            Login with GitHub
        </button>

        <span class='text-sm text-text-muted'>Secure Authentication via GitHub</span>
        <span class='text-sm text-text-muted'>We never store your data</span>

    </div>
</div>