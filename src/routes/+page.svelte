<script lang = "ts">
    import ArticleHeader from "../components/article_header.svelte";
    import article_meta_data from "../article_repository/article_metadata.json";
    console.log(article_meta_data);

    /** @type {import('./$types').PageData} */
    export let data;
    let repos = data.repos;
</script>


<body class = "w-screen h-screen font-serif">
<div class = "flex flex-col text-center">
    <h3 class = "lg:text-5xl md:text-4xl text-2xl lg:mt-36 md:mt-24 mt-18">Mason Wheeler</h3>
    <p class = "underline">Stuff that I have or will design</p>
</div>

<div class="divider"></div>
{#each article_meta_data.articles as article}
    <ArticleHeader title = {article.title} description = {article.description} date = {article.date} tags = {article.tags}, url = {article.url} />
{/each}
</body>