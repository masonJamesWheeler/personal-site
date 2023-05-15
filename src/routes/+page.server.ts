/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
    const response = await fetch('https://api.github.com/users/masonJamesWheeler/repos');
    const repos = await response.json();


    return { repos };
}

