{
  description = "dodaat — do one day at a time";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "dodaat";

          packages = with pkgs; [
            nodejs_22
            pnpm
            git
            gh
          ];

          shellHook = ''
            echo "dodaat devshell — node $(node --version), pnpm $(pnpm --version)"
          '';
        };
      }
    );
}
