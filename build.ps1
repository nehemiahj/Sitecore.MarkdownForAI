<#
.SYNOPSIS
  Builds Sitecore.MarkdownForAI, runs the tests and writes the release files to dist/.

.DESCRIPTION
  1. Builds the module (net48, Sitecore 10.1 to 10.5).
  2. Runs the .NET and JavaScript tests.
  3. Writes, for version <v> (the <Version> in the .csproj):
     dist/Sitecore.MarkdownForAI-<v>.zip        Sitecore package (Installation Wizard): files and items
     dist/Sitecore.MarkdownForAI-<v>-files.zip  the same files laid out as the web root, plus the CLI serialization
     dist/Sitecore.MarkdownForAI.<v>.nupkg      NuGet package for solutions built in CI: the assembly, plus the config,
                                                view and scripts published with the referencing web project
     dist/files/                                 the unzipped -files.zip

.EXAMPLE
  ./build.ps1
  ./build.ps1 -SkipTests
#>
param(
    [string]$Configuration = 'Release',
    [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$project = Join-Path $root 'src/Sitecore.MarkdownForAI/Sitecore.MarkdownForAI.csproj'
$version = ([xml](Get-Content $project -Raw)).Project.PropertyGroup.Version | Where-Object { $_ } | Select-Object -First 1

Push-Location $root
try {
    dotnet build $project -c $Configuration --nologo -v q
    if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }

    if (-not $SkipTests) {
        dotnet test (Join-Path $root 'tests/Sitecore.MarkdownForAI.Tests') -c $Configuration --nologo -v q
        if ($LASTEXITCODE -ne 0) { throw '.NET tests failed.' }

        Push-Location (Join-Path $root 'js/ask-ai')
        try {
            npm test --silent
            if ($LASTEXITCODE -ne 0) { throw 'JavaScript tests failed.' }
        }
        finally { Pop-Location }
    }

    $distRoot = Join-Path $root 'dist'
    if (Test-Path $distRoot) { Remove-Item $distRoot -Recurse -Force }
    $dist = Join-Path $distRoot 'files'
    New-Item -ItemType Directory -Force (Join-Path $dist 'bin') | Out-Null

    $binary = Join-Path $root "src/Sitecore.MarkdownForAI/bin/$Configuration/net48"
    Copy-Item (Join-Path $binary 'Sitecore.MarkdownForAI.dll'), (Join-Path $binary 'Sitecore.MarkdownForAI.pdb'), (Join-Path $binary 'Sitecore.MarkdownForAI.xml') (Join-Path $dist 'bin')

    Copy-Item (Join-Path $root 'config/App_Config') $dist -Recurse
    Copy-Item (Join-Path $root 'serialization') $dist -Recurse

    Copy-Item (Join-Path $root 'views') (Join-Path $dist 'Views') -Recurse

    # Served at /scripts/markdownforai/ (MarkdownForAI.AskAi.ScriptUrl).
    $js = Join-Path $dist 'scripts/markdownforai'
    New-Item -ItemType Directory -Force $js | Out-Null
    Copy-Item (Join-Path $root 'js/ask-ai/src/*.js') $js

    $filesZip = Join-Path $distRoot "Sitecore.MarkdownForAI-$version-files.zip"
    Compress-Archive -Path (Join-Path $dist '*') -DestinationPath $filesZip
    Write-Host "Files: $filesZip"

    # Sitecore package. Everything is installed on the CM; CD servers get the same files from your
    # deployment and the items by publishing.
    $packageFiles = @(
        'bin/Sitecore.MarkdownForAI.dll',
        'App_Config/Modules/MarkdownForAI/Sitecore.MarkdownForAI.config',
        'App_Config/Include/MarkdownForAI/z.MarkdownForAI.Site.config.example',
        'Views/MarkdownForAI/AskAi.cshtml',
        'scripts/markdownforai/ask-ai.js'
    ) | ForEach-Object { @{ Source = (Join-Path $dist $_); Target = $_ } }

    # Merge updates the module's own items on upgrade. Skip leaves shared parent folders alone and keeps
    # editors' changes to the Ask AI items (button text, prompt, assistants).
    $itemModes = @(
        @{ Path = '/sitecore/templates/Modules'; Mode = 'Skip' },
        @{ Path = '/sitecore/layout/Placeholder Settings/Modules'; Mode = 'Skip' },
        @{ Path = '/sitecore/templates/Modules/Markdown For AI'; Mode = 'Merge' },
        @{ Path = '/sitecore/system/Modules/Markdown For AI'; Mode = 'Merge' },
        @{ Path = '/sitecore/system/Modules/Markdown For AI/Ask AI'; Mode = 'Skip' },
        @{ Path = '/sitecore/layout/Renderings/Modules/Markdown For AI'; Mode = 'Merge' },
        @{ Path = '/sitecore/layout/Placeholder Settings/Modules/Markdown For AI'; Mode = 'Merge' }
    )

    $readme = @"
Sitecore.MarkdownForAI ${version}: an Ask AI button for Sitecore MVC pages, and a clean Markdown version of each page (/page.md) for the assistants to read.

After installing:
1. Rename App_Config/Include/MarkdownForAI/z.MarkdownForAI.Site.config.example to z.MarkdownForAI.Site.config and set your site names and excluded placeholders.
2. Publish /sitecore/templates/Modules/Markdown For AI, /sitecore/system/Modules/Markdown For AI and the Markdown For AI rendering and placeholder settings.
3. Deploy the same files to your CD servers. /page.md is served on Standalone and ContentDelivery servers only.
4. Add the Ask AI rendering to your page or article templates.

Documentation: https://github.com/nehemiahj/Sitecore.MarkdownForAI
"@

    & (Join-Path $root 'tools/New-SitecorePackage.ps1') -ItemsPath (Join-Path $root 'serialization/items') `
        -OutputPath (Join-Path $distRoot "Sitecore.MarkdownForAI-$version.zip") `
        -Name 'Sitecore.MarkdownForAI' -Version $version -Author 'Nehemiah Jeyakumar' -Publisher 'Nehemiah Jeyakumar' `
        -Readme $readme -Files $packageFiles -ItemModes $itemModes

    dotnet pack $project -c $Configuration --no-build --nologo -v q -o $distRoot
    if ($LASTEXITCODE -ne 0) { throw 'NuGet pack failed.' }
}
finally {
    Pop-Location
}
