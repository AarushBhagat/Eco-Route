#include <iostream>
#include <vector>
#include <cmath>
#include <limits>
#include <algorithm>

using namespace std;

struct Point {
    double x, y;
    int id;
};

double dist(const Point& a, const Point& b) {
    return sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y));
}

// Build MST using Prim's algorithm
vector<vector<int>> buildMST(const vector<Point>& points) {
    int n = points.size();
    vector<double> minDist(n, numeric_limits<double>::max());
    vector<int> parent(n, -1);
    vector<bool> inMST(n, false);
    minDist[0] = 0;
    for (int i = 0; i < n; ++i) {
        int u = -1;
        for (int v = 0; v < n; ++v) {
            if (!inMST[v] && (u == -1 || minDist[v] < minDist[u])) {
                u = v;
            }
        }
        inMST[u] = true;
        for (int v = 0; v < n; ++v) {
            if (!inMST[v]) {
                double d = dist(points[u], points[v]);
                if (d < minDist[v]) {
                    minDist[v] = d;
                    parent[v] = u;
                }
            }
        }
    }
    // Build adjacency list
    vector<vector<int>> adj(n);
    for (int v = 1; v < n; ++v) {
        adj[v].push_back(parent[v]);
        adj[parent[v]].push_back(v);
    }
    return adj;
}

// Traverse MST with DFS to get route
void dfsMST(int u, const vector<vector<int>>& adj, vector<bool>& visited, vector<int>& route) {
    visited[u] = true;
    route.push_back(u);
    for (int v : adj[u]) {
        if (!visited[v]) dfsMST(v, adj, visited, route);
    }
}

int main() {
    int n;
    cin >> n;
    vector<Point> pts(n);
    for (int i = 0; i < n; ++i) {
        cin >> pts[i].x >> pts[i].y;
        pts[i].id = i;
    }
    // Build MST
    vector<vector<int>> adj = buildMST(pts);
    // Traverse MST with DFS to get route
    vector<bool> visited(n, false);
    vector<int> route;
    dfsMST(0, adj, visited, route);
    // Calculate total route length
    double totalLength = 0.0;
    for (size_t i = 1; i < route.size(); ++i) {
        totalLength += dist(pts[route[i-1]], pts[route[i]]);
    }
    // Output: first line is route (DFS order), second line is total length
    for (size_t i = 0; i < route.size(); ++i) {
        if (i) cout << " ";
        cout << route[i];
    }
    cout << endl;
    cout << totalLength << endl;
    return 0;
}