import { WireAction } from "@/types";

export const ACTION_REGISTRY: WireAction[] = [
  {
    id: "linkedin.profile.read",
    platform: "linkedin",
    name: "Read Profile",
    description: "Extract public and authenticated profile data for a LinkedIn user",
    category: "read",
    requiresAuth: true,
    inputFields: [
      { key: "profileUrl", label: "Profile URL", type: "url", required: true, description: "Full LinkedIn profile URL", example: "https://linkedin.com/in/username" }
    ],
    outputFields: [
      { key: "name", label: "Full Name", type: "string", required: true, description: "Profile name" },
      { key: "headline", label: "Headline", type: "string", required: false, description: "Profile headline" },
      { key: "currentRole", label: "Current Role", type: "object", required: false, description: "Current position details" },
      { key: "experience", label: "Experience", type: "object", required: false, description: "Work experience array" }
    ]
  },
  {
    id: "linkedin.search.people",
    platform: "linkedin",
    name: "Search People",
    description: "Search LinkedIn for people by keywords, company, or title",
    category: "search",
    requiresAuth: true,
    inputFields: [
      { key: "keywords", label: "Keywords", type: "string", required: true, description: "Search terms", example: "software engineer" },
      { key: "company", label: "Company", type: "string", required: false, description: "Filter by company", example: "Google" },
      { key: "limit", label: "Result Limit", type: "number", required: false, description: "Max profiles to return", example: "10" }
    ],
    outputFields: [
      { key: "results", label: "Results", type: "object", required: true, description: "Array of profile previews" },
      { key: "totalCount", label: "Total Count", type: "number", required: true, description: "Total matching profiles" }
    ]
  },
  {
    id: "linkedin.message.send",
    platform: "linkedin",
    name: "Send Message",
    description: "Send a LinkedIn message to a connection",
    category: "write",
    requiresAuth: true,
    inputFields: [
      { key: "profileUrl", label: "Profile URL", type: "url", required: true, description: "Recipient LinkedIn profile", example: "https://linkedin.com/in/username" },
      { key: "message", label: "Message", type: "string", required: true, description: "Message body", example: "Hi, I came across your profile..." }
    ],
    outputFields: [
      { key: "sent", label: "Sent", type: "boolean", required: true, description: "Whether the message was sent" },
      { key: "messageId", label: "Message ID", type: "string", required: false, description: "ID of sent message" }
    ]
  },
  {
    id: "amazon.product.read",
    platform: "amazon",
    name: "Read Product",
    description: "Extract product details including price, reviews, and availability",
    category: "read",
    requiresAuth: false,
    inputFields: [
      { key: "productUrl", label: "Product URL", type: "url", required: true, description: "Full Amazon product URL", example: "https://amazon.com/dp/B08N5WRWNW" }
    ],
    outputFields: [
      { key: "title", label: "Title", type: "string", required: true, description: "Product title" },
      { key: "price", label: "Price", type: "number", required: true, description: "Current price in USD" },
      { key: "rating", label: "Rating", type: "number", required: false, description: "Average star rating" },
      { key: "reviewCount", label: "Review Count", type: "number", required: false, description: "Number of reviews" },
      { key: "availability", label: "Availability", type: "string", required: false, description: "Stock status" }
    ]
  },
  {
    id: "amazon.search.products",
    platform: "amazon",
    name: "Search Products",
    description: "Search Amazon for products by keyword",
    category: "search",
    requiresAuth: false,
    inputFields: [
      { key: "query", label: "Query", type: "string", required: true, description: "Search query", example: "wireless headphones" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max results", example: "5" }
    ],
    outputFields: [
      { key: "results", label: "Results", type: "object", required: true, description: "Array of product summaries" }
    ]
  },
  {
    id: "twitter.search.tweets",
    platform: "twitter",
    name: "Search Tweets",
    description: "Search recent tweets by keyword or hashtag",
    category: "search",
    requiresAuth: true,
    inputFields: [
      { key: "query", label: "Query", type: "string", required: true, description: "Search query or hashtag", example: "#reactjs" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max tweets", example: "20" }
    ],
    outputFields: [
      { key: "tweets", label: "Tweets", type: "object", required: true, description: "Array of tweet objects" }
    ]
  },
  {
    id: "twitter.post.tweet",
    platform: "twitter",
    name: "Post Tweet",
    description: "Post a new tweet",
    category: "write",
    requiresAuth: true,
    inputFields: [
      { key: "text", label: "Tweet Text", type: "string", required: true, description: "Tweet content", example: "Excited to launch..." }
    ],
    outputFields: [
      { key: "tweetId", label: "Tweet ID", type: "string", required: true, description: "ID of posted tweet" },
      { key: "tweetUrl", label: "Tweet URL", type: "url", required: true, description: "Link to the tweet" }
    ]
  },
  {
    id: "instagram.profile.read",
    platform: "instagram",
    name: "Read Profile",
    description: "Extract Instagram profile data",
    category: "read",
    requiresAuth: false,
    inputFields: [
      { key: "username", label: "Username", type: "string", required: true, description: "Instagram username", example: "instagram" }
    ],
    outputFields: [
      { key: "followers", label: "Followers", type: "number", required: true, description: "Follower count" },
      { key: "following", label: "Following", type: "number", required: true, description: "Following count" },
      { key: "bio", label: "Bio", type: "string", required: false, description: "Profile bio" },
      { key: "postCount", label: "Post Count", type: "number", required: true, description: "Number of posts" }
    ]
  },
  {
    id: "glassdoor.reviews.read",
    platform: "glassdoor",
    name: "Read Reviews",
    description: "Extract company reviews from Glassdoor",
    category: "read",
    requiresAuth: false,
    inputFields: [
      { key: "companyUrl", label: "Company URL", type: "url", required: true, description: "Glassdoor company page URL", example: "https://glassdoor.com/Reviews/Google-Reviews-E9079.htm" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max reviews", example: "10" }
    ],
    outputFields: [
      { key: "reviews", label: "Reviews", type: "object", required: true, description: "Array of reviews with rating, title, text" },
      { key: "overallRating", label: "Overall Rating", type: "number", required: true, description: "Company average rating" }
    ]
  },
  {
    id: "shopify.product.read",
    platform: "shopify",
    name: "Read Product",
    description: "Read product data from a Shopify storefront",
    category: "read",
    requiresAuth: false,
    inputFields: [
      { key: "storeUrl", label: "Store URL", type: "url", required: true, description: "Shopify store URL", example: "https://store.myshopify.com" },
      { key: "productHandle", label: "Product Handle", type: "string", required: true, description: "Product slug", example: "premium-t-shirt" }
    ],
    outputFields: [
      { key: "title", label: "Title", type: "string", required: true, description: "Product title" },
      { key: "price", label: "Price", type: "number", required: true, description: "Product price" },
      { key: "variants", label: "Variants", type: "object", required: false, description: "Product variants" }
    ]
  },
  {
    id: "shopify.products.list",
    platform: "shopify",
    name: "List Products",
    description: "List all products from a Shopify storefront",
    category: "read",
    requiresAuth: false,
    inputFields: [
      { key: "storeUrl", label: "Store URL", type: "url", required: true, description: "Shopify store URL", example: "https://store.myshopify.com" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max products", example: "20" }
    ],
    outputFields: [
      { key: "products", label: "Products", type: "object", required: true, description: "Array of product objects" }
    ]
  },
  {
    id: "jira.issues.search",
    platform: "jira",
    name: "Search Issues",
    description: "Search Jira issues by JQL query",
    category: "search",
    requiresAuth: true,
    inputFields: [
      { key: "jql", label: "JQL Query", type: "string", required: true, description: "Jira Query Language string", example: "project = PROJ AND status = 'In Progress'" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max issues", example: "50" }
    ],
    outputFields: [
      { key: "issues", label: "Issues", type: "object", required: true, description: "Array of issue objects" }
    ]
  },
  {
    id: "jira.issue.create",
    platform: "jira",
    name: "Create Issue",
    description: "Create a new Jira issue",
    category: "write",
    requiresAuth: true,
    inputFields: [
      { key: "projectKey", label: "Project Key", type: "string", required: true, description: "Jira project key", example: "PROJ" },
      { key: "summary", label: "Summary", type: "string", required: true, description: "Issue summary", example: "Fix login bug" },
      { key: "description", label: "Description", type: "string", required: false, description: "Issue description" },
      { key: "issueType", label: "Issue Type", type: "string", required: false, description: "Bug, Task, Story", example: "Bug" }
    ],
    outputFields: [
      { key: "issueKey", label: "Issue Key", type: "string", required: true, description: "Jira issue key" },
      { key: "issueUrl", label: "Issue URL", type: "url", required: true, description: "Link to created issue" }
    ]
  },
  {
    id: "notion.page.read",
    platform: "notion",
    name: "Read Page",
    description: "Read content from a Notion page",
    category: "read",
    requiresAuth: true,
    inputFields: [
      { key: "pageUrl", label: "Page URL", type: "url", required: true, description: "Notion page URL", example: "https://notion.so/workspace/page-id" }
    ],
    outputFields: [
      { key: "title", label: "Title", type: "string", required: true, description: "Page title" },
      { key: "content", label: "Content", type: "object", required: true, description: "Page content blocks" }
    ]
  },
  {
    id: "notion.database.append",
    platform: "notion",
    name: "Append to Database",
    description: "Add a row to a Notion database",
    category: "write",
    requiresAuth: true,
    inputFields: [
      { key: "databaseUrl", label: "Database URL", type: "url", required: true, description: "Notion database URL", example: "https://notion.so/workspace/db-id" },
      { key: "properties", label: "Properties", type: "object", required: true, description: "Column values as JSON", example: '{"Name": {"title": [{"text": {"content": "New entry"}}]}}' }
    ],
    outputFields: [
      { key: "pageId", label: "Page ID", type: "string", required: true, description: "ID of created page" },
      { key: "pageUrl", label: "Page URL", type: "url", required: true, description: "Link to created row" }
    ]
  },
  {
    id: "slack.message.send",
    platform: "slack",
    name: "Send Message",
    description: "Post a message to a Slack channel",
    category: "write",
    requiresAuth: true,
    inputFields: [
      { key: "channel", label: "Channel", type: "string", required: true, description: "Channel name or ID", example: "#general" },
      { key: "text", label: "Message", type: "string", required: true, description: "Message text", example: "Pipeline completed successfully!" }
    ],
    outputFields: [
      { key: "ts", label: "Timestamp", type: "string", required: true, description: "Message timestamp" },
      { key: "channel", label: "Channel", type: "string", required: true, description: "Confirm channel" }
    ]
  },
  {
    id: "slack.channel.read",
    platform: "slack",
    name: "Read Channel",
    description: "Read recent messages from a Slack channel",
    category: "read",
    requiresAuth: true,
    inputFields: [
      { key: "channel", label: "Channel", type: "string", required: true, description: "Channel name or ID", example: "#general" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max messages", example: "10" }
    ],
    outputFields: [
      { key: "messages", label: "Messages", type: "object", required: true, description: "Array of message objects" }
    ]
  },
  {
    id: "google.maps.search",
    platform: "google-maps",
    name: "Search Places",
    description: "Search Google Maps for businesses or places",
    category: "search",
    requiresAuth: false,
    inputFields: [
      { key: "query", label: "Query", type: "string", required: true, description: "Search query", example: "coffee shops near me" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max results", example: "10" }
    ],
    outputFields: [
      { key: "places", label: "Places", type: "object", required: true, description: "Array of place objects with name, rating, address" }
    ]
  },
  {
    id: "reddit.subreddit.read",
    platform: "reddit",
    name: "Read Subreddit",
    description: "Read posts from a subreddit",
    category: "read",
    requiresAuth: false,
    inputFields: [
      { key: "subreddit", label: "Subreddit", type: "string", required: true, description: "Subreddit name", example: "webdev" },
      { key: "sort", label: "Sort", type: "string", required: false, description: "hot, new, top", example: "hot" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max posts", example: "25" }
    ],
    outputFields: [
      { key: "posts", label: "Posts", type: "object", required: true, description: "Array of post objects" }
    ]
  },
  {
    id: "airbnb.search.listings",
    platform: "airbnb",
    name: "Search Listings",
    description: "Search Airbnb for property listings",
    category: "search",
    requiresAuth: false,
    inputFields: [
      { key: "location", label: "Location", type: "string", required: true, description: "City or region", example: "Barcelona" },
      { key: "checkIn", label: "Check In", type: "string", required: false, description: "Check-in date", example: "2026-06-01" },
      { key: "checkOut", label: "Check Out", type: "string", required: false, description: "Check-out date", example: "2026-06-05" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max listings", example: "10" }
    ],
    outputFields: [
      { key: "listings", label: "Listings", type: "object", required: true, description: "Array of listing objects with price, rating" }
    ]
  },
  {
    id: "github.issues.search",
    platform: "github",
    name: "Search Issues",
    description: "Search GitHub issues across repositories",
    category: "search",
    requiresAuth: false,
    inputFields: [
      { key: "query", label: "Query", type: "string", required: true, description: "GitHub issue search query", example: "repo:facebook/react is:issue is:open bug" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max results", example: "20" }
    ],
    outputFields: [
      { key: "issues", label: "Issues", type: "object", required: true, description: "Array of issue objects" }
    ]
  },
  {
    id: "github.issue.create",
    platform: "github",
    name: "Create Issue",
    description: "Create a GitHub issue",
    category: "write",
    requiresAuth: true,
    inputFields: [
      { key: "repo", label: "Repository", type: "string", required: true, description: "owner/repo", example: "facebook/react" },
      { key: "title", label: "Title", type: "string", required: true, description: "Issue title", example: "Fix accessibility bug in modal" },
      { key: "body", label: "Body", type: "string", required: false, description: "Issue description" }
    ],
    outputFields: [
      { key: "issueNumber", label: "Issue Number", type: "number", required: true, description: "Issue number" },
      { key: "issueUrl", label: "Issue URL", type: "url", required: true, description: "Link to issue" }
    ]
  },
  {
    id: "trustpilot.reviews.read",
    platform: "trustpilot",
    name: "Read Reviews",
    description: "Extract reviews from a Trustpilot company page",
    category: "read",
    requiresAuth: false,
    inputFields: [
      { key: "companyUrl", label: "Company URL", type: "url", required: true, description: "Trustpilot company page", example: "https://trustpilot.com/review/company.com" },
      { key: "limit", label: "Limit", type: "number", required: false, description: "Max reviews", example: "20" }
    ],
    outputFields: [
      { key: "reviews", label: "Reviews", type: "object", required: true, description: "Array of reviews with rating, title, text" },
      { key: "overallRating", label: "Overall Rating", type: "number", required: true, description: "Company average rating" }
    ]
  },
  {
    id: "trustpilot.review.reply",
    platform: "trustpilot",
    name: "Reply to Review",
    description: "Post a reply to a Trustpilot review",
    category: "write",
    requiresAuth: true,
    inputFields: [
      { key: "reviewId", label: "Review ID", type: "string", required: true, description: "ID of the review to reply to" },
      { key: "replyText", label: "Reply", type: "string", required: true, description: "Reply text", example: "Thank you for your feedback..." }
    ],
    outputFields: [
      { key: "replied", label: "Replied", type: "boolean", required: true, description: "Whether reply was posted" }
    ]
  },
];

export function getActionById(id: string): WireAction | undefined {
  return ACTION_REGISTRY.find((a) => a.id === id);
}

export function getActionsByPlatform(platform: string): WireAction[] {
  return ACTION_REGISTRY.filter((a) => a.platform === platform);
}

export function getActionsByCategory(category: WireAction["category"]): WireAction[] {
  return ACTION_REGISTRY.filter((a) => a.category === category);
}
