# Colby's RC Playground

[rc.colbyr.com](https://rc.colbyr.com)

Workspace for prokects while I'm at [RC](https://recurse.com).

## Running locally

```sh
yarn
yarn dev
```

## Add a new page

Add a new folder with an `index.html`.

```
./newpage/index.html
```

Add an entry to the [`"publishedPages"`](https://github.com/colbyr/rc-playground/blob/b4cad69efc43e46a1713b0785639f2b70649decc/package.json#L34-L39) field in package.json.

```json
"publishedPages": [
  "...",
  "newpage",
  "..."
],
```
