// Definition of a class Article
export class Article {
    title: string;
    authors = new Array<string>();
    date: Date;
    content: string;
    tags = new Array<string>();
    slug: string;

    constructor(title: string, authors: string[], date: Date, content: string, tags: string[], slug: string) {
        this.title = title;
        this.authors = authors;
        this.date = date;
        this.content = content;
        this.tags = tags;
        this.slug = slug;
    }
}

// Definition of a class ArticleList
export class ArticleList {
    articles = new Array<Article>();

    constructor(articles: Article[]) {
        this.articles = articles;
    }
}

