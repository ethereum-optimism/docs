# Public Resources Folder

Non-text resources like JSON files that are designed to be made available publicly should sit within the [public/resources](/public/resources/) folder at the root of this repository.
Files within this folder can be referenced by linking to `/resources/path/to/file` as if the `resources` folder existed at the root level of the project, similar to the way that images are referenced by linking to `/img/path/to/image`.
Nextra will automatically handle the translation of these links to the `/resources` folder to point to the actual `/public/resources` folder.
The [Lychee](./lychee.md) configuration file found at [lychee.toml](/lychee.toml) includes a remapping that will allow Lychee to correctly check for these resources during the link checking CI step.
