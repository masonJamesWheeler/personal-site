<script lang="ts">
export let title, description, date, tags, url;
</script>

<body class = "font-serif">
    <a href="{url}">
        <div class = "w-full text-center">
            <h3 class = "lg:text-3xl md:text-2xl text-2xl lg:mt-24 md:mt-16 mt-12">{title}</h3>
            <p class = "underline">{description}</p>
            <p class = "text-sm">{date}</p>
            <p class = "text-sm">{tags}</p>
        </div>
    </a>
</body>
