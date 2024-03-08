class HeaderComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
        <style>
            @keyframes rainbow{
                from, to { box-shadow: 0 0 15px 0 red }
                16% { box-shadow: 0 0 15px 0  yellow }
                32% { box-shadow: 0 0 15px 0  green }
                48% { box-shadow: 0 0 15px 0  aqua }
                64% { box-shadow: 0 0 15px 0  blue }
                80% { box-shadow: 0 0 15px 0  fuchsia }
            }

            @keyframes rainbowText{
                from, to { color: red }
                16% { color:  yellow }
                32% { color:  green }
                48% { color:  aqua }
                64% { color:  blue }
                80% { color:  fuchsia }
            }
            
            :host {
                display: block;
                width: 100vw;
            }

            .sticky-header {
                font-family: "Trebuchet MS";
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                background-color: #2c2f33c2;
                color: white;
                z-index: 1000;
                animation: rainbow 10s infinite;
                display: flex;
                justify-content: center;
                padding: 0px 10px 0px 0px;
            }

            .nav-links {
                list-style: none;
                display: flex;
            }
            
            .nav-links li {
                padding: 1vh;
                margin-right: 2vw;
                
                background-color: #2c2f33c2;
            }
            
            .nav-links a {
                padding: 2.5vw;
                color: white;
                text-decoration: none;
                transition: color 0.3s ease;
            }

            .nav-links a:hover {
                animation: rainbowText 3s infinite;
                text-decoration: underline;
            }

            .title {
                position: absolute;
                top: 1.5vh;
                left: 1.5vw;
                padding: 0.5vw 2vw 0.5vw;
            }

            .nav-links p {
                background-color: black;
                margin-left: -90vw;
                text-align: justify;
                text-justify: inter-character;
                font-size: 105%;
            }

            img {
                position: absolute;
                left: 1vw;
                top: 1vh;
                width: 5cap;
                height: 5cap;
                border-radius: 25%;
            }

        </style>
        <div class="sticky-header">
            <nav class="nav-bar">
                <ul class="nav-links">
                    <li><a href="index.html">Home</a></li>
                    <li><a href="forum.html">Forums</a></li>
                </ul>
            </nav>
        </div>
        `;
    }
}
// --------TODO------------(add these!!)
// <li><a href="games.html">Games</a></li>
// <li><a href="music.html">Music</a></li>
// <li><a href="blog.html">Blog</a></li>
window.customElements.define('header-component', HeaderComponent);
